import { cleanHistory, describeError, getModel, retrieve, streamAnswer, validateQuestion } from "@/lib/ask";
import { checkLimits, LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

function minutes(sec: number) {
  const m = Math.max(1, Math.ceil(sec / 60));
  return m >= 90 ? `${Math.round(m / 60)} timer` : `${m} min`;
}

// Logger bare utfall og latens. Aldri spørsmålet, svaret eller IP-en.
function log(outcome: string, ms: number) {
  console.log(JSON.stringify({ ev: "ask", outcome, ms }));
}

export async function POST(req: Request) {
  const started = Date.now();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Forespørselen var ikke gyldig JSON." }, 400);
  }
  const v = validateQuestion((body as { question?: unknown } | null)?.question);
  if (!v.ok) return json({ error: v.error }, 400);

  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "ukjent";
  let limit;
  try {
    limit = await checkLimits(ip);
  } catch {
    log("limit_error", Date.now() - started);
    return json({ error: "Telleren for kostnadsvern svarer ikke, så spørsmålet ble ikke sendt. Prøv igjen om litt." }, 503);
  }
  if (!limit.ok) {
    log(`limited_${limit.reason}`, Date.now() - started);
    const error =
      limit.reason === "hour"
        ? `Du har brukt opp ${LIMITS.perHour} spørsmål denne timen. Prøv igjen om ${minutes(limit.retryAfterSec)}.`
        : limit.reason === "day"
          ? `Du har brukt opp ${LIMITS.perDay} spørsmål i dag. Prøv igjen om ${minutes(limit.retryAfterSec)}.`
          : "Demoen har nådd dagens grense for antall spørsmål. Den åpner igjen i morgen.";
    return json({ error, reason: limit.reason }, 429, { "Retry-After": String(limit.retryAfterSec) });
  }

  const history = cleanHistory((body as { history?: unknown } | null)?.history);
  const { hits, terms } = retrieve(v.question, history);
  const enc = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
      send({
        type: "sources",
        terms,
        sources: hits.map((h) => ({ d: h.d, t: h.t, p: h.p, score: h.score, x: h.x })),
      });
      try {
        const s = streamAnswer(v.question, hits, history);
        s.on("text", (text) => send({ type: "delta", text }));
        const final = await s.finalMessage();
        if (final.stop_reason === "refusal") {
          send({ type: "error", message: "Språkmodellen avslo å svare på dette spørsmålet." });
          log("refusal", Date.now() - started);
        } else {
          const ms = Date.now() - started;
          const cut = final.stop_reason === "max_tokens";
          send({ type: "done", ms, model: getModel(), cut });
          log(cut ? "cut" : "ok", ms);
        }
      } catch (err) {
        send({ type: "error", message: describeError(err) });
        log("error", Date.now() - started);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
