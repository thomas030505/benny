/**
 * Lar språkmodellen lese dokumentene én gang og trekke ut
 *   1) kravene i planbestemmelsene, sortert på fase, og
 *   2) steder der dokumentene oppgir ulike tall for samme ting.
 * Hvert punkt må ha et ordrett sitat. Sitatet kontrolleres maskinelt mot siden det viser til,
 * og punkter der sitatet ikke finnes, forkastes. Resultatet skrives til data/findings-raw.json
 * og gjennomgås for hånd før det kopieres til data/findings.json, som nettsiden viser.
 * Kjør: npx tsx --env-file=.env.local scripts/findings.ts
 */
import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "node:fs";
import { PAGES } from "../src/lib/search";

const MODEL = process.env.FINDINGS_MODEL || "claude-opus-5-5";
const client = new Anthropic({ maxRetries: 2, timeout: 600_000 });

const squash = (s: string) => s.toLowerCase().replace(/[\s­"«»“”'’‐‑–—-]+/g, "");
const pageText = (d: string, p: number) => PAGES.find((x) => x.d === d && x.p === p)?.x ?? "";
const quoted = (d: string, p: number, quote: string) => {
  const q = squash(quote);
  return q.length >= 12 && squash(pageText(d, p)).includes(q);
};

const dump = (d?: string) =>
  PAGES.filter((p) => !d || p.d === d)
    .map((p) => `=== [${p.d} s. ${p.p}] ===\n${p.x}`)
    .join("\n\n");

async function askJson(system: string, user: string) {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    thinking: { type: "adaptive" },
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = await stream.finalText();
  const from = text.indexOf("{");
  const to = text.lastIndexOf("}");
  return JSON.parse(text.slice(from, to + 1));
}

const PHASES = ["ramme", "ig", "anlegg", "bruk"] as const;

async function requirements() {
  const out = await askJson(
    `Du leser reguleringsbestemmelser for et byggeprosjekt og trekker ut krav som utbygger eller entreprenør må oppfylle til et bestemt tidspunkt.
Returner bare JSON: {"items":[{"phase":"ramme|ig|anlegg|bruk","text":"...","p":<sidetall>,"quote":"..."}]}.
- phase: "ramme" = må følge søknad om rammetillatelse eller være på plass før rammetillatelse. "ig" = før igangsettingstillatelse. "anlegg" = gjelder mens bygge- og anleggsarbeidet pågår. "bruk" = før brukstillatelse eller ferdigattest.
- text: kravet med egne ord på norsk, én setning, maks 22 ord, konkret (hva skal foreligge eller være ferdig). Behold feltnavn og tall slik de står.
- p: siden kravet står på.
- quote: 40 til 180 tegn kopiert ORDRETT fra den siden, som viser kravet. Ikke rett skrivefeil, ikke hopp over ord.
Ta bare med krav som er knyttet til en av de fire fasene. Ett punkt per krav. Ikke ta med generelle utformingsregler uten tidspunkt. Ikke gjett.`,
    dump("planbestemmelser")
  );
  const items = (out.items as { phase: string; text: string; p: number; quote: string }[]).filter(
    (i) => (PHASES as readonly string[]).includes(i.phase) && typeof i.text === "string"
  );
  const ok = items.filter((i) => quoted("planbestemmelser", i.p, i.quote));
  console.log(`Krav: ${items.length} foreslått, ${ok.length} med sitat som finnes på siden.`);
  for (const i of items.filter((i) => !ok.includes(i))) console.log(`  forkastet s. ${i.p}: ${i.text}`);
  return ok;
}

async function conflicts() {
  const out = await askJson(
    `Du kvalitetssikrer fire plandokumenter i samme reguleringssak (planbestemmelser, planbeskrivelse, saksfremlegg, fagnotat).
Finn steder der dokumentene oppgir ULIKE tall eller ulike faktiske opplysninger om SAMME ting i det vedtatte planforslaget, enten mellom to dokumenter eller innad i ett dokument.
Returner bare JSON: {"items":[{"topic":"...","note":"...","a":{"d":"<dokumentnøkkel>","p":<side>,"says":"...","quote":"..."},"b":{...}}]}.
- topic: hva det gjelder, maks 6 ord.
- note: én setning på norsk som sier hva som er ulikt, maks 25 ord.
- d: dokumentnøkkelen slik den står i overskriften over hver side (planbestemmelser, planbeskrivelse, saksfremlegg eller fagnotat).
- says: tallet eller opplysningen, kort.
- quote: 40 til 200 tegn kopiert ORDRETT fra siden. Ikke rett skrivefeil.
Vær streng. Ikke ta med forskjeller som skyldes at teksten beskriver ulike alternativer, dagens situasjon mot ny situasjon, ulike delområder, ulike måleenheter, avrundinger som er forklart, eller et tidligere forslag som senere ble endret og der teksten sier det. Ta bare med tilfeller der en leser ikke kan vite hvilket tall som gjelder. Heller få sikre enn mange usikre.`,
    dump()
  );
  type Side = { d: string; p: number; says: string; quote: string };
  const items = out.items as { topic: string; note: string; a: Side; b: Side }[];
  const ok = items.filter((i) => quoted(i.a.d, i.a.p, i.a.quote) && quoted(i.b.d, i.b.p, i.b.quote));
  console.log(`Avvik: ${items.length} foreslått, ${ok.length} der begge sitatene finnes på siden.`);
  for (const i of items.filter((i) => !ok.includes(i))) console.log(`  forkastet: ${i.topic}`);
  return ok;
}

async function main() {
  const [req, con] = await Promise.all([requirements(), conflicts()]);
  writeFileSync(
    new URL("../data/findings-raw.json", import.meta.url),
    JSON.stringify({ model: MODEL, ranAt: new Date().toISOString(), requirements: req, conflicts: con }, null, 2)
  );
  console.log("Skrev data/findings-raw.json");
}

main();
