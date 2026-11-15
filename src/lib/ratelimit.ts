/**
 * Kostnadsvern: 15 spørsmål per time og 40 per døgn per IP, pluss en global døgngrense (DAILY_CAP).
 *
 * Bruker Upstash Redis når miljøvariablene finnes (Vercel-integrasjonen setter dem).
 * Uten Redis brukes en teller i minnet. Den gjelder bare per serverinstans og nullstilles
 * ved kaldstart, så på Vercel er den et svakt vern. Sett opp Redis før lenken deles.
 */
import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";

export const LIMITS = {
  perHour: Number(process.env.RATE_PER_HOUR ?? 15),
  perDay: Number(process.env.RATE_PER_DAY ?? 40),
  dailyCap: Number(process.env.DAILY_CAP ?? 500),
};

export type LimitResult =
  | { ok: true }
  | { ok: false; reason: "hour" | "day" | "cap"; retryAfterSec: number };

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

export const rateLimitBackend = redis ? "redis" : "memory";

const mem = new Map<string, { n: number; exp: number }>();

async function incr(key: string, ttlSec: number): Promise<number> {
  if (redis) {
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, ttlSec);
    return n;
  }
  const now = Date.now();
  if (mem.size > 5000) for (const [k, v] of mem) if (v.exp < now) mem.delete(k);
  const cur = mem.get(key);
  if (!cur || cur.exp < now) {
    mem.set(key, { n: 1, exp: now + ttlSec * 1000 });
    return 1;
  }
  cur.n += 1;
  return cur.n;
}

/** Maks 10 passordforsøk per 10 minutter per IP, så passordet ikke kan gjettes i løkke. */
export async function checkUnlockAttempt(ip: string): Promise<boolean> {
  const slot = Math.floor(Date.now() / 600_000);
  const who = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  return (await incr(`hvs:pw:${who}:${slot}`, 600)) <= 10;
}

export async function checkLimits(ip: string): Promise<LimitResult> {
  const now = Date.now();
  const hour = Math.floor(now / 3_600_000);
  const day = Math.floor(now / 86_400_000);
  const toNextHour = Math.ceil(((hour + 1) * 3_600_000 - now) / 1000);
  const toNextDay = Math.ceil(((day + 1) * 86_400_000 - now) / 1000);
  // IP-en lagres aldri i klartekst, bare som en avkortet hash.
  const who = createHash("sha256").update(ip).digest("hex").slice(0, 16);

  if ((await incr(`hvs:h:${who}:${hour}`, 3600)) > LIMITS.perHour)
    return { ok: false, reason: "hour", retryAfterSec: toNextHour };
  if ((await incr(`hvs:d:${who}:${day}`, 86400)) > LIMITS.perDay)
    return { ok: false, reason: "day", retryAfterSec: toNextDay };
  if ((await incr(`hvs:cap:${day}`, 86400)) > LIMITS.dailyCap)
    return { ok: false, reason: "cap", retryAfterSec: toNextDay };
  return { ok: true };
}
