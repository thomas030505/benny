/**
 * Testsettet: 10 spørsmål med fasit og 2 feller der svaret ikke står i dokumentene.
 * Ikke endre fasiten for å få bedre score. Endre søk eller prompt.
 */
import { NOT_FOUND, parseCitations } from "./prompt";
import type { Hit } from "./search";

export type Test = {
  id: number;
  q: string;
  /** Kort fasit som vises på siden. */
  expected: string;
  /** Felle: riktig svar er at det ikke står i dokumentene. */
  trap?: boolean;
  /** Alle må finnes i svaret. */
  must?: string[];
  /** En sitert side teller som riktig kilde når teksten på siden matcher dette. */
  evidence?: string;
};

export const TESTS: Test[] = [
  { id: 1, q: "Hvor stor skal sansehagen være?", expected: "Minimum 750 m²", must: ["750"], evidence: "750 m2" },
  {
    id: 2,
    q: "Hvor mange offentlige parkeringsplasser tillates totalt?",
    expected: "Maksimalt 119",
    must: ["119"],
    evidence: "119",
  },
  {
    id: 3,
    q: "Hvor mange plasser får helse- og velferdssenteret?",
    expected: "72 plasser",
    must: ["72"],
    evidence: "72 (plasser|brukere)",
  },
  {
    id: 4,
    q: "Hva er maksimalt bebygd areal (BYA) for tjenesteyting?",
    expected: "3700 m²",
    must: ["3\\s?700"],
    evidence: "3700 m2",
  },
  {
    id: 5,
    q: "Hvilket støynivå gjelder for sansehagen?",
    expected: "Lden ≤ 50 dB",
    must: ["50\\s?dB"],
    evidence: "Lden ≤ 50 dB",
  },
  {
    id: 6,
    q: "Hvor bred kan kulverten være?",
    expected: "Maksimum 8 meter",
    must: ["8 m"],
    evidence: "bredde på 8 meter",
  },
  {
    id: 7,
    q: "Er det registrert kvikkleire i grunnen?",
    expected: "Nei, ikke registrert",
    must: ["ikke registrert|\\bnei\\b"],
    evidence: "ikke registrert kvikkleire",
  },
  {
    id: 8,
    q: "Når godkjente bystyret planen?",
    expected: "19.06.2025",
    must: ["19\\.06\\.2025|19\\. juni 2025"],
    evidence: "19\\.06\\.2025",
  },
  {
    id: 9,
    q: "Hva er kontraktsverdien for byggingen?",
    expected: "Om lag 450 millioner kroner ekskl. mva.",
    must: ["450"],
    evidence: "450 millioner",
  },
  {
    id: 10,
    q: "Hvilken entreprenør skal bygge senteret?",
    expected: "Betonmast Trøndelag",
    must: ["Betonmast"],
    evidence: "Betonmast Trøndelag",
  },
  { id: 11, q: "Hva blir husleien for beboerne?", expected: NOT_FOUND, trap: true },
  { id: 12, q: "Hvilken leverandør skal levere heisene?", expected: NOT_FOUND, trap: true },
];

export type Grade = { correct: boolean; sourceOk: boolean };

export function grade(test: Test, answer: string, hits: Hit[]): Grade {
  const notFound = answer.toLowerCase().includes(NOT_FOUND.toLowerCase());
  if (test.trap) return { correct: notFound, sourceOk: notFound };

  const correct = !notFound && (test.must ?? []).every((m) => new RegExp(m, "i").test(answer));
  const evidence = new RegExp(test.evidence ?? "$^", "i");
  const sourceOk = parseCitations(answer).some((c) =>
    hits.some((h) => h.t === c.t && h.p === c.p && evidence.test(h.x.replace(/\s+/g, " ")))
  );
  return { correct, sourceOk };
}
