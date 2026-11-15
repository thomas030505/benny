/** Kontrollerer at hvert nøkkeltall i src/lib/facts.ts faktisk står på siden det viser til. Kjør: npx tsx scripts/check-facts.ts */
import { FACTS } from "../src/lib/facts";
import { PAGES } from "../src/lib/search";

let failed = 0;
for (const f of FACTS) {
  const text = (PAGES.find((p) => p.d === f.d && p.p === f.p)?.x ?? "").replace(/\s+/g, " ").toLowerCase();
  const ok = text.includes(f.find.toLowerCase());
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "FEIL"} ${f.h}: «${f.find}» på ${f.d} s. ${f.p}`);
}
process.exit(failed ? 1 : 0);
