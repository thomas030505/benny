/**
 * Nøkkelordsøk over sidene i data/pages.json. Ingen vektordatabase.
 * Ord kuttes til prefikser på 6 tegn (grov norsk stemming), stoppord fjernes,
 * og spørsmålet utvides med en liten synonymliste. Rangering: BM25.
 */
import pagesJson from "../../data/pages.json";

export type Page = { d: string; t: string; p: number; x: string };
export type Hit = Page & { score: number };

export const PAGES = pagesJson as Page[];

const PREFIX = 6;

const STOP = new Set(
  `og i jeg det at en et den til er som på de med han av ikke der så var meg seg men ett har om vi min mitt ha hadde hun nå over da ved fra du ut sin dem oss opp man kan hans hvor eller hva skal selv sjøl her alle vil bli ble blitt kunne inn når være kom noen noe ville dere deres kun ja etter ned skulle denne for deg si sine sitt mot å meget hvorfor dette disse uten hvordan ingen din ditt blir samme hvilken hvilke hvilket sånn inni mellom vår hver hvem vors hvis både bare enn fordi før mange også slik vært være båe begge siden dykk dykkar dei deira deires deim di då eg ein eit eitt elles honom hjå ho hoe henne hennar hennes hoss hossen ikkje ingi inkje korleis korso kva kvar kvarhelst kven kvi kvifor me medan mi mine mykje no nokon noka nokor noko nokre sia sidan so somt somme um upp vere vore verte vort varte vart mye mange få får gjelder finnes står sier stor store`
    .split(/\s+/)
);

// Nøklene og verdiene er prefikser på 6 tegn. Synonymer teller halvt.
const SYNONYMS: Record<string, string[]> = {
  flytte: ["innfly", "oppsta", "fremdr"],
  innfly: ["flytte", "oppsta", "fremdr"],
  naboen: ["merkna", "innspi", "hørin", "uttale", "nabo", "nabole"],
  naboer: ["merkna", "innspi", "hørin", "uttale", "nabo"],
  mener: ["merkna", "innspi", "uttale"],
  stort: ["daa", "areal"],
  adress: ["ringvå", "gnr", "eiendo"],
  starte: ["bygges", "riggpl", "anlegg"],
  byggin: ["bygges", "anlegg", "riggpl"],
  parker: ["bilpar", "p-kjel", "plasse"],
  bilpar: ["parker"],
  sykehj: ["helse", "velfer", "hvs", "beboer"],
  hvs: ["helse", "velfer"],
  senter: ["helse", "velfer"],
  beboer: ["plasse", "bruker", "sykehj", "pasien"],
  bruker: ["plasse", "beboer"],
  støy: ["lden", "støyni", "støyso"],
  støyni: ["lden", "støy"],
  høyde: ["kotehø", "gesims", "møneh", "etasje"],
  høyt: ["kotehø", "gesims", "møneh", "etasje"],
  etasje: ["høyde", "kjelle"],
  avfall: ["renova", "søppel"],
  søppel: ["renova", "avfall"],
  renova: ["avfall"],
  areal: ["bya", "m2", "bebygd"],
  bya: ["bebygd", "utnytt"],
  bebygd: ["bya", "utnytt"],
  størr: ["m2", "areal", "daa"],
  vedtat: ["vedtar", "vedtak", "godkje", "bystyr"],
  vedtak: ["vedtar", "godkje", "bystyr"],
  godkje: ["vedtak", "vedtar", "bystyr"],
  grunnf: ["geotek", "kvikkl", "skred"],
  kvikkl: ["grunnf", "geotek"],
  kostna: ["økonom", "kroner", "millio"],
  koster: ["økonom", "kroner", "millio", "kostna"],
  byggek: ["kostna", "økonom", "kroner"],
  pris: ["kostna", "økonom", "kroner"],
  entrep: ["utbygg", "tiltak", "bygghe", "betonm", "totale"],
  bygger: ["utbygg", "tiltak", "bygges", "betonm", "entrep"],
  ferdig: ["bygges", "bruksti", "gjenno"],
  bygges: ["gjenno", "anlegg"],
  overva: ["fordrø", "regnbe", "flomve"],
  trær: ["bevari", "vegeta", "gatetr"],
  klima: ["klimag", "utslip", "miljø"],
  utslip: ["klimag", "klima"],
  blågrø: ["bgf", "grønn"],
  tak: ["takfla", "takter", "gesims"],
  materi: ["tegl", "puss", "trever", "fasade"],
  fasade: ["materi", "tegl", "utform"],
  uteare: ["sanseh", "utomhu", "opphol"],
  hage: ["sanseh"],
  biblio: ["bydels"],
  trafik: ["kjørem", "rundkj", "vendeh", "ådt"],
  øker: ["øke", "økning", "økt", "ådt"],
  økning: ["øke", "øker", "økt", "ådt"],
  varele: ["nyttek", "varemo"],
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9æøåéèü-]+/g, " ")
    .split(" ")
    .map((w) => w.replace(/^-+|-+$/g, ""))
    .filter((w) => w.length >= 2 && !STOP.has(w))
    .map((w) => w.slice(0, PREFIX));
}

/** Prefiksene fra spørsmålet (uten synonymer). Brukes til å markere utdrag i klienten. */
export function queryTerms(question: string): string[] {
  return [...new Set(tokenize(question))];
}

export function makeSearch(pages: Page[]) {
  const K1 = 1.5;
  const B = 0.75;
  const docs = pages.map((p) => {
    const tf = new Map<string, number>();
    const toks = tokenize(p.x);
    for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
    return { tf, len: toks.length };
  });
  const avgLen = docs.reduce((a, d) => a + d.len, 0) / Math.max(1, docs.length);
  const df = new Map<string, number>();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);

  return function search(question: string, k = 8): Hit[] {
    const weights = new Map<string, number>();
    for (const t of queryTerms(question)) {
      weights.set(t, 1);
      for (const s of SYNONYMS[t] ?? []) if (!weights.has(s)) weights.set(s, 0.5);
    }
    const scored: Hit[] = [];
    docs.forEach((d, i) => {
      let score = 0;
      for (const [t, w] of weights) {
        const f = d.tf.get(t);
        if (!f) continue;
        const n = df.get(t) ?? 0;
        const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
        score += w * idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / avgLen)));
      }
      // Bestemmelsene er den juridisk bindende kilden, så de går foran når flere sider er like gode.
      if (pages[i].d === "planbestemmelser") score *= 1.3;
      if (score > 0) scored.push({ ...pages[i], score: Math.round(score * 100) / 100 });
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, k);
  };
}

export const search = makeSearch(PAGES);
