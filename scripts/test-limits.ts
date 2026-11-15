/**
 * Tester inndatakontroll, rate limit og daglig grense mot selve rutehandleren i /api/ask.
 * Grensene settes lavt med miljøvariabler, så testen koster bare ett kall.
 * Kjør: npm run test:limits
 */
export {};

async function call(question: unknown, ip: string) {
  const { POST } = await import("../src/app/api/ask/route");
  const res = await POST(
    new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ question }),
    })
  );
  const text = await res.text();
  const error = res.ok ? null : JSON.parse(text).error;
  return { status: res.status, error, retryAfter: res.headers.get("Retry-After") };
}

const scenario = process.argv[2];
let failed = 0;
function check(name: string, got: { status: number; error: string | null }, want: number) {
  const ok = got.status === want;
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "FEIL"} ${name}: HTTP ${got.status}${got.error ? ` «${got.error}»` : ""}`);
}

async function main() {
  if (scenario === "hour") {
    check("tomt spørsmål avvises", await call("   ", "10.0.0.1"), 400);
    check("301 tegn avvises", await call("a".repeat(301), "10.0.0.1"), 400);
    check("1. spørsmål fra IP A slipper gjennom", await call("Hvor stor skal sansehagen være?", "10.0.0.2"), 200);
    check("2. spørsmål fra IP A stoppes (timegrense)", await call("Hvor stor skal sansehagen være?", "10.0.0.2"), 429);
  } else if (scenario === "day") {
    check("spørsmål stoppes (døgngrense per IP)", await call("Hvor stor skal sansehagen være?", "10.0.0.3"), 429);
  } else if (scenario === "cap") {
    check("spørsmål stoppes (global døgngrense)", await call("Hvor stor skal sansehagen være?", "10.0.0.4"), 429);
  }
  process.exit(failed ? 1 : 0);
}

main();
