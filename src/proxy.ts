import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GATE_COOKIE, LOGIN_PATH, UNLOCK_PATH, gatePassword, gateToken, sameToken } from "@/lib/gate";

// Alt bak passord: siden, kildene og /api/ask. Bare innloggingen og robots.txt er åpne.
export async function proxy(req: NextRequest) {
  const password = gatePassword();
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const cookie = req.cookies.get(GATE_COOKIE)?.value ?? "";
  const unlocked = cookie !== "" && sameToken(cookie, await gateToken(password));

  if (pathname === LOGIN_PATH) {
    return unlocked ? NextResponse.redirect(new URL("/", req.url)) : NextResponse.next();
  }
  if (pathname === UNLOCK_PATH || unlocked) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Siden er låst. Logg inn med passordet først." }, { status: 401 });
  }
  return NextResponse.redirect(new URL(LOGIN_PATH, req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt).*)"],
};
