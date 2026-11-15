/**
 * Passordsperre for hele siden. Passordet står bare i miljøvariabelen SITE_PASSWORD.
 * Informasjonskapselen inneholder en hash av passordet, aldri passordet selv.
 * Er SITE_PASSWORD tom, er sperren av (lokal utvikling).
 */
export const GATE_COOKIE = "hvs_gate";
export const GATE_MAX_AGE = 60 * 60 * 24 * 30;
export const LOGIN_PATH = "/logg-inn";
export const UNLOCK_PATH = "/api/unlock";

export function gatePassword(): string | null {
  const pw = process.env.SITE_PASSWORD?.trim();
  return pw ? pw : null;
}

export async function gateToken(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`hvs-gate:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Sammenligner uten å lekke hvor strengene skiller seg. */
export function sameToken(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
