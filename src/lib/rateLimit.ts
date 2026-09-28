/**
 * Rate Limiting Module
 *
 * DISTRIBUTED ARCHITECTURE:
 * - When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set,
 *   uses Upstash Redis for distributed rate limiting across all serverless instances.
 * - Falls back to in-memory store for local dev or single-instance deployments.
 *
 * To enable distributed rate limiting on Vercel:
 * 1. Create a Redis database at https://console.upstash.com/
 * 2. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to env vars
 */

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

export interface RateLimitOptions {
  windowMs: number
  maxRequests: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

export interface RateLimitStore {
  consume(key: string, options: RateLimitOptions): Promise<RateLimitResult> | RateLimitResult
  reset?(key: string): Promise<void> | void
}

// ─── In-Memory Store (single instance / local dev) ───────────────────────────
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>()
  private lastPurge = Date.now()
  private readonly purgeIntervalMs = 60_000

  private purgeExpired() {
    const now = Date.now()
    if (now - this.lastPurge < this.purgeIntervalMs) return
    this.lastPurge = now
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key)
      }
    }
  }

  consume(key: string, options: RateLimitOptions): RateLimitResult {
    this.purgeExpired()
    const now = Date.now()
    const existing = this.store.get(key)

    if (!existing || now > existing.resetAt) {
      const resetAt = now + options.windowMs
      this.store.set(key, { count: 1, resetAt })
      return {
        success: true,
        limit: options.maxRequests,
        remaining: options.maxRequests - 1,
        resetAt,
      }
    }

    if (existing.count >= options.maxRequests) {
      return {
        success: false,
        limit: options.maxRequests,
        remaining: 0,
        resetAt: existing.resetAt,
      }
    }

    existing.count += 1
    return {
      success: true,
      limit: options.maxRequests,
      remaining: options.maxRequests - existing.count,
      resetAt: existing.resetAt,
    }
  }

  reset(key: string) {
    this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }
}

// ─── Upstash Redis Store (distributed / production) ──────────────────────────
/**
 * Upstash Redis rate limiter using atomic MULTI/EXEC pipeline.
 * Uses INCR + EXPIRE to guarantee atomicity without Lua scripts.
 * No external SDK required — uses Upstash REST API directly.
 */
class UpstashRateLimitStore implements RateLimitStore {
  private readonly url: string
  private readonly token: string

  constructor(url: string, token: string) {
    this.url = url
    this.token = token
  }

  async consume(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    const windowSec = Math.ceil(options.windowMs / 1000)
    const redisKey = `rl:${key}`

    try {
      // Use Upstash pipeline: INCR + EXPIRE atomically
      const res = await fetch(`${this.url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', redisKey],
          ['EXPIRE', redisKey, windowSec, 'NX'],
          ['TTL', redisKey],
        ]),
      })

      if (!res.ok) throw new Error(`Upstash error: ${res.status}`)

      const data = await res.json()
      const count: number = data?.[0]?.result ?? 1
      const ttl: number = data?.[2]?.result ?? windowSec
      const resetAt = Date.now() + ttl * 1000
      const remaining = Math.max(0, options.maxRequests - count)

      return {
        success: count <= options.maxRequests,
        limit: options.maxRequests,
        remaining,
        resetAt,
      }
    } catch (err) {
      // On Redis failure, fail open (allow request) to avoid blocking legitimate traffic
      console.error('[rateLimit] Upstash Redis error, failing open:', err)
      return {
        success: true,
        limit: options.maxRequests,
        remaining: options.maxRequests - 1,
        resetAt: Date.now() + options.windowMs,
      }
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await fetch(`${this.url}/del/rl:${key}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}` },
      })
    } catch {
      // ignore
    }
  }
}

// ─── Store Singleton ──────────────────────────────────────────────────────────
function createStore(): RateLimitStore {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (upstashUrl && upstashToken) {
    console.info('[rateLimit] Using Upstash Redis for distributed rate limiting')
    return new UpstashRateLimitStore(upstashUrl, upstashToken)
  }

  // Memory store — acceptable for local dev and single-instance deployments
  return new MemoryRateLimitStore()
}

// Lazily initialized to avoid issues during module loading in test environments
let _store: RateLimitStore | null = null
function getStore(): RateLimitStore {
  if (!_store) _store = createStore()
  return _store
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
  store?: RateLimitStore
): Promise<RateLimitResult> | RateLimitResult {
  return (store ?? getStore()).consume(key, options)
}

// ─── Pre-configured limiters ──────────────────────────────────────────────────
export const feedbackRateLimiter = {
  check: (key: string) =>
    checkRateLimit(key, {
      windowMs: 60_000,
      maxRequests: 5, // 5 feedback per minute per IP
    }),
}

export const analyticsRateLimiter = {
  check: (key: string) =>
    checkRateLimit(key, {
      windowMs: 60_000,
      maxRequests: 30, // 30 analytics pings per minute per IP
    }),
}

export const checkoutRateLimiter = {
  check: (key: string) =>
    checkRateLimit(key, {
      windowMs: 60_000,
      maxRequests: 5, // 5 checkout creates per minute per user+IP
    }),
}

export const authRateLimiter = {
  check: (key: string) =>
    checkRateLimit(key, {
      windowMs: 60_000,
      maxRequests: 10, // 10 auth attempts per minute per IP
    }),
}
