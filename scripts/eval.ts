/**
 * Kjører testsettet mot samme logikk som /api/ask (søk, prompt, modell) og
 * skriver data/eval-results.json, som nettsiden viser statisk.
 * Kjør: npm run eval   (koster 10 kall)
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { getModel, retrieve, streamAnswer } from "../src/lib/ask";
import { parseCitations } from "../src/lib/prompt";
import { TESTS, grade } from "../src/lib/tests";

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY mangler i .env.local");
  const results = [];
  for (const test of TESTS) {
    const t0 = Date.now();
    const { hits } = retrieve(test.q);
    let answer = "";
    let error: string | null = null;
    try {
      answer = (await streamAnswer(test.q, hits).finalText()).trim();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    const ms = Date.now() - t0;
    const g = error ? { correct: false, sourceOk: false } : grade(test, answer, hits);
    results.push({
      id: test.id,
      q: test.q,
      expected: test.expected,
      trap: !!test.trap,
      answer: error ? `FEIL: ${error}` : answer,
      citations: parseCitations(answer),
      correct: g.correct,
      sourceOk: g.sourceOk,
      ms,
    });
    console.log(
      `${g.correct ? "RIKTIG" : "FEIL  "} ${g.sourceOk ? "kilde ok " : "kilde feil"} ${(ms / 1000).toFixed(1)} s  ${test.id}. ${test.q}\n        ${error ?? answer}\n`
    );
  }
  const out = {
    model: getModel(),
    ranAt: new Date().toISOString(),
    score: results.filter((r) => r.correct).length,
    sourceScore: results.filter((r) => r.sourceOk).length,
    total: results.length,
    results,
  };
  await writeFile(path.join(process.cwd(), "data", "eval-results.json"), JSON.stringify(out, null, 2));
  console.log(`Riktig svar: ${out.score}/${out.total}. Riktig kilde: ${out.sourceScore}/${out.total}. Modell: ${out.model}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
