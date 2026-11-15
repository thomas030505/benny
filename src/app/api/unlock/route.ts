import { GATE_COOKIE, GATE_MAX_AGE, LOGIN_PATH, gatePassword, gateToken, sameToken } from "@/lib/gate";
import { checkUnlockAttempt } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirect(location: string, cookie?: string) {
  const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
  if (cookie) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}

// Tar imot passordet fra skjemaet på /logg-inn. Logger ingenting.
export async function POST(req: Request) {
  const password = gatePassword();
  if (!password) return redirect("/");

  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "ukjent";
  let allowed = true;
  try {
    allowed = await checkUnlockAttempt(ip);
  } catch {
    allowed = false;
  }
  if (!allowed) return redirect(`${LOGIN_PATH}?feil=mange`);

  let given = "";
  try {
    given = String((await req.formData()).get("password") ?? "").trim();
  } catch {
    given = "";
  }
  const want = await gateToken(password);
  if (!given || !sameToken(await gateToken(given), want)) return redirect(`${LOGIN_PATH}?feil=passord`);

  return redirect(
    "/",
    `${GATE_COOKIE}=${want}; Path=/; Max-Age=${GATE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`
  );
}
