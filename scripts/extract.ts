/**
 * Laster ned plandokumentene og trekker ut tekst side for side til data/pages.json.
 * Kjør: npm run extract
 *
 * Nytt dokument: legg til en linje i DOCS i src/lib/docs.ts og oppdater EXPECTED_PAGES samme sted.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { DOCS, EXPECTED_PAGES, NOTES } from "../src/lib/docs";

type Page = { d: string; t: string; p: number; x: string };

async function pageText(page: any): Promise<string> {
  const content = await page.getTextContent();
  let out = "";
  for (const item of content.items as any[]) {
    if (typeof item.str !== "string") continue;
    out += item.str;
    out += item.hasEOL ? "\n" : "";
  }
  return out
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function main() {
  const pages: Page[] = [];
  for (const doc of DOCS) {
    const res = await fetch(doc.url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`Kunne ikke laste ned ${doc.d}: HTTP ${res.status}`);
    const data = new Uint8Array(await res.arrayBuffer());
    const pdf = await getDocument({ data, useSystemFonts: true, verbosity: 0 }).promise;
    for (let p = 1; p <= pdf.numPages; p++) {
      pages.push({ d: doc.d, t: doc.t, p, x: await pageText(await pdf.getPage(p)) });
    }
    console.log(`${doc.t}: ${pdf.numPages} sider`);
  }

  for (const n of NOTES) pages.push({ d: n.d, t: n.t, p: 1, x: n.x });
  console.log(`Totalt: ${pages.length} sider`);
  if (pages.length !== EXPECTED_PAGES) {
    console.error(
      `STOPP: forventet ${EXPECTED_PAGES} sider, fikk ${pages.length}. pages.json er ikke skrevet. ` +
        `Har du lagt til et dokument, oppdater EXPECTED_PAGES i src/lib/docs.ts.`
    );
    process.exit(1);
  }

  const dir = path.join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "pages.json"), JSON.stringify(pages));
  const empty = pages.filter((p) => p.x.length < 40).map((p) => `${p.t} s. ${p.p}`);
  if (empty.length) console.log(`Sider nesten uten tekst (trolig bilder/kart): ${empty.join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
