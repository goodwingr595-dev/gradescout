import { Redis } from "@upstash/redis";

const GLOBAL_CAP = Number(process.env.MAX_GRADINGS_PER_DAY_GLOBAL ?? 200);
const VISITOR_CAP = Number(process.env.MAX_GRADINGS_PER_DAY_PER_VISITOR ?? 5);
const SECONDS_IN_DAY = 60 * 60 * 24;

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

function todayKeySuffix(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

/** Atomically bump a counter key, setting a 24h expiry the first time it's created. */
async function incrWithDailyExpiry(client: Redis, key: string): Promise<number> {
  const count = await client.incr(key);
  if (count === 1) {
    await client.expire(key, SECONDS_IN_DAY);
  }
  return count;
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: "global" | "visitor"; cap: number };

/**
 * Checks and (if allowed) consumes one grading credit for this visitor.
 *
 * If Upstash isn't configured (no env vars set), this fails OPEN -- grading
 * still works, just without any cap. That's fine for local dev, but you
 * should not run the public site in production without setting these, since
 * it's the only thing standing between one visitor and your Anthropic bill.
 */
export async function checkAndConsumeGradingCredit(
  visitorId: string
): Promise<RateLimitResult> {
  const client = getRedis();
  if (!client) {
    return { allowed: true };
  }

  const day = todayKeySuffix();
  const globalKey = `gradescout:global:${day}`;
  const visitorKey = `gradescout:visitor:${visitorId}:${day}`;

  const globalCount = await incrWithDailyExpiry(client, globalKey);
  if (globalCount > GLOBAL_CAP) {
    return { allowed: false, reason: "global", cap: GLOBAL_CAP };
  }

  const visitorCount = await incrWithDailyExpiry(client, visitorKey);
  if (visitorCount > VISITOR_CAP) {
    return { allowed: false, reason: "visitor", cap: VISITOR_CAP };
  }

  return { allowed: true };
}

/** Best-effort visitor fingerprint. Good enough to slow down casual abuse, not meant to be robust. */
export function getVisitorId(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
  return ip;
}
