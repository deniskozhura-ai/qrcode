import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRateLimitStore, checkRateLimit } from '@/lib/rateLimit'
import { getClientIp, isValidIp } from '@/lib/requestIp'

describe('Rate Limiting & IP Security (Requirement 9, 10 & 29)', () => {
  let store: MemoryRateLimitStore

  beforeEach(() => {
    store = new MemoryRateLimitStore()
  })

  it('allows 5 requests within the window and blocks the 6th request (429 simulation)', () => {
    const ip = '198.51.100.42'
    const options = { windowMs: 60_000, maxRequests: 5 }

    // First 5 requests should pass
    for (let i = 1; i <= 5; i++) {
      const result = checkRateLimit(ip, options, store)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(5 - i)
    }

    // 6th request must be rejected
    const blockedResult = checkRateLimit(ip, options, store)
    expect(blockedResult.success).toBe(false)
    expect(blockedResult.remaining).toBe(0)
  })

  it('isolates rate limits between different IP addresses', () => {
    const options = { windowMs: 60_000, maxRequests: 2 }

    checkRateLimit('198.51.100.1', options, store)
    checkRateLimit('198.51.100.1', options, store)
    const ip1Blocked = checkRateLimit('198.51.100.1', options, store)
    expect(ip1Blocked.success).toBe(false)

    // IP 2 is fresh and must not be affected by IP 1
    const ip2Result = checkRateLimit('198.51.100.2', options, store)
    expect(ip2Result.success).toBe(true)
    expect(ip2Result.remaining).toBe(1)
  })

  it('resets quota after windowMs expires', () => {
    const options = { windowMs: 10, maxRequests: 1 } // 10ms window

    const first = checkRateLimit('198.51.100.99', options, store)
    expect(first.success).toBe(true)

    const blocked = checkRateLimit('198.51.100.99', options, store)
    expect(blocked.success).toBe(false)

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const afterExpiry = checkRateLimit('198.51.100.99', options, store)
        expect(afterExpiry.success).toBe(true)
        resolve()
      }, 25)
    })
  })

  describe('Safe IP Extraction & Spoofing Resistance', () => {
    it('validates valid IPv4 and IPv6 addresses', () => {
      expect(isValidIp('192.168.1.1')).toBe(true)
      expect(isValidIp('8.8.8.8')).toBe(true)
      expect(isValidIp('127.0.0.1')).toBe(true)
      expect(isValidIp('::1')).toBe(true)
      expect(isValidIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true)
    })

    it('rejects invalid, injected, or malformed IP formats', () => {
      expect(isValidIp('999.999.999.999')).toBe(false)
      expect(isValidIp('1.2.3.4; DROP TABLE users')).toBe(false)
      expect(isValidIp('<script>')).toBe(false)
      expect(isValidIp('not-an-ip')).toBe(false)
    })

    it('extracts trusted proxy IP over spoofed headers', () => {
      // Vercel proxy header takes precedence over raw untrusted x-forwarded-for
      const req = new Request('https://example.com/api/feedback', {
        headers: {
          'x-vercel-forwarded-for': '203.0.113.195',
          'x-forwarded-for': 'spoofed-fake-ip',
        },
      })
      expect(getClientIp(req)).toBe('203.0.113.195')
    })

    it('sanitizes x-forwarded-for and rejects malicious injection', () => {
      const req = new Request('https://example.com/api/feedback', {
        headers: {
          'x-forwarded-for': 'malicious-string, 198.51.100.5',
        },
      })
      // It iterates to find the first valid IP format
      expect(getClientIp(req)).toBe('198.51.100.5')
    })
  })

  describe('Pre-configured Endpoints Rate Limiting', () => {
    it('verifies checkoutRateLimiter limits checkout session creations to 5 per window', async () => {
      const { checkoutRateLimiter } = await import('@/lib/rateLimit')
      const userId = 'usr_checkout_test_123'

      for (let i = 0; i < 5; i++) {
        expect(checkoutRateLimiter.check(userId).success).toBe(true)
      }
      expect(checkoutRateLimiter.check(userId).success).toBe(false)
    })

    it('verifies authRateLimiter limits login/register attempts to 10 per window', async () => {
      const { authRateLimiter } = await import('@/lib/rateLimit')
      const ip = '198.51.100.88'

      for (let i = 0; i < 10; i++) {
        expect(authRateLimiter.check(ip).success).toBe(true)
      }
      expect(authRateLimiter.check(ip).success).toBe(false)
    })
  })
})
