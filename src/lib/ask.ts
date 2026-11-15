/**
 * Kjernen i /api/ask: søk, prompt og Claude-kall. Brukes også av scripts/eval.ts,
 * slik at testsettet kjører nøyaktig samme logikk som nettsiden.
 */
import Anthropic from "@anthropic-ai/sdk";
import { buildPrompt, type Turn } from "./prompt";
import { NOTES } from "./docs";
import { search, queryTerms, type Hit } from "./search";

export const MAX_QUESTION_LENGTH = 300;
export const TOP_K = 10;

export function getModel() {
  return process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
}

export function validateQuestion(input: unknown): { ok: true; question: string } | { ok: false; error: string } {
  if (typeof input !== "string" || !input.trim()) return { ok: false, error: "Skriv et spørsmål først." };
  const question = input.trim();
  if (question.length > MAX_QUESTION_LENGTH)
    return { ok: false, error: `Spørsmålet er for langt. Maks ${MAX_QUESTION_LENGTH} tegn.` };
  return { ok: true, question };
}

/** Tar bare med de to siste rundene, og kutter lange svar. Ugyldig inndata gir tom historikk. */
export function cleanHistory(input: unknown): Turn[] {
  if (!Array.isArray(input)) return [];
  const out: Turn[] = [];
  for (const t of input.slice(-2)) {
    const q = (t as { q?: unknown } | null)?.q;
    const a = (t as { a?: unknown } | null)?.a;
    if (typeof q !== "string" || typeof a !== "string") continue;
    if (!q.trim() || q.length > MAX_QUESTION_LENGTH) continue;
    out.push({ q: q.trim(), a: a.trim().slice(0, 1200) });
  }
  return out;
}

/**
 * Søker på spørsmålet. I en samtale søkes det også på forrige spørsmål sammen med det nye,
 * slik at oppfølginger som «og hvor mange av dem er i kjelleren?» finner riktig side.
 */
/**
 * Pressemeldingene er korte og har det nyeste om selve byggingen (entreprenør, verdi, fremdrift).
 * Fagrapportene fortrenger dem i søket på generelle spørsmål, så de følger alltid med når søket har treff.
 */
function withNotes(hits: Hit[]): Hit[] {
  if (!hits.length) return hits;
  const extra = NOTES.filter((n) => !hits.some((h) => h.d === n.d)).map((n) => ({ d: n.d, t: n.t, p: 1, x: n.x, score: 0 }));
  return [...hits, ...extra];
}

export function retrieve(question: string, history: Turn[] = []): { hits: Hit[]; terms: string[] } {
  const r = retrieveCore(question, history);
  return { hits: withNotes(r.hits), terms: r.terms };
}

function retrieveCore(question: string, history: Turn[] = []): { hits: Hit[]; terms: string[] } {
  const own = search(question, TOP_K);
  const terms = queryTerms(question);
  const prev = history.at(-1)?.q;
  if (!prev) return { hits: own, terms };
  const wide = search(`${prev} ${question}`, TOP_K);
  const key = (h: Hit) => `${h.d}-${h.p}`;
  const hits = own.slice(0, 5);
  for (const h of [...wide, ...own]) {
    if (hits.length >= TOP_K) break;
    if (!hits.some((x) => key(x) === key(h))) hits.push(h);
  }
  return { hits, terms: [...new Set([...terms, ...queryTerms(prev)])] };
}

/**
 * Sonnet 5.5 og Haiku 5.5 avviser temperature (400), så den sendes ikke.
 * I stedet slås tenkingen av, som gir korte, raske og stabile svar:
 * Sonnet 5.5 bruker «between_tools», Haiku 5.5 bruker «disabled».
 */
function thinkingFor(model: string): Anthropic.ThinkingConfigParam | undefined {
  if (model.startsWith("claude-sonnet-5-5")) return { type: "between_tools" };
  if (model.startsWith("claude-haiku-5-5")) return { type: "disabled" };
  return undefined;
}

let client: Anthropic | null = null;

export function streamAnswer(question: string, hits: Hit[], history: Turn[] = []) {
  client ??= new Anthropic({ maxRetries: 1, timeout: 25_000 });
  const model = getModel();
  const { system, user } = buildPrompt(question, hits, history);
  const thinking = thinkingFor(model);
  return client.messages.stream({
    model,
    max_tokens: 600,
    system,
    messages: [{ role: "user", content: user }],
    output_config: { effort: "low" },
    ...(thinking ? { thinking } : {}),
  });
}

/** Norsk feilmelding som sier hva som skjedde, uten å lekke detaljer. */
export function describeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError)
    return "Serveren mangler en gyldig API-nøkkel. Si fra til Thomas.";
  if (err instanceof Anthropic.RateLimitError)
    return "Språkmodellen har for mange forespørsler akkurat nå. Prøv igjen om et minutt.";
  if (err instanceof Anthropic.APIConnectionTimeoutError) return "Språkmodellen brukte for lang tid. Prøv igjen.";
  if (err instanceof Anthropic.APIConnectionError) return "Fikk ikke kontakt med språkmodellen. Prøv igjen.";
  if (err instanceof Anthropic.BadRequestError || err instanceof Anthropic.NotFoundError)
    return "Språkmodellen avviste forespørselen. Det er en feil i oppsettet, ikke i spørsmålet ditt.";
  if (err instanceof Anthropic.APIError) return "Språkmodellen er utilgjengelig akkurat nå. Prøv igjen om litt.";
  return "Noe gikk galt på serveren. Prøv igjen.";
}
