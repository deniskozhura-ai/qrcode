/**
 * Rate Limiting Module
 * 
 * SERVERLESS ARCHITECTURE NOTE:
 * In a multi-instance serverless environment (e.g., Vercel Lambdas), in-memory stores
 * are local to each warm lambda instance.
 * For strict distributed rate limiting across thousands of concurrent lambdas,
 * swap MemoryRateLimitStore with Upstash / Redis using the RateLimitStore interface below.
 * 
 * For single-server and standard development/student workloads, the memory store
 * provides robust, leak-free rate limiting with automatic garbage collection of expired keys.
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

// Global in-memory rate limiter store
const memoryStore = new MemoryRateLimitStore()

/**
 * Check rate limit for a given identifier (e.g. client IP or user ID)
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
  store: RateLimitStore = memoryStore
): RateLimitResult {
  return store.consume(key, options) as RateLimitResult
}

// Pre-configured rate limiters
export const feedbackRateLimiter = {
  check: (key: string) =>
    checkRateLimit(key, {
      windowMs: 60_000, // 1 minute
      maxRequests: 5,   // max 5 feedback submissions per minute
    }),
}

export const analyticsRateLimiter = {
  check: (key: string) =>
    checkRateLimit(key, {
      windowMs: 60_000, // 1 minute
      maxRequests: 30,  // max 30 analytics pings per minute
    }),
}
