import { describe, it, expect } from 'vitest'
import nextConfig from '../../next.config'

describe('HTTP Security Headers (Requirement 21)', () => {
  it('verifies all critical security headers are configured in next.config.ts', async () => {
    expect(nextConfig.headers).toBeDefined()
    const headerConfigs = await nextConfig.headers!()
    expect(headerConfigs.length).toBeGreaterThan(0)

    const rootHeaders = headerConfigs.find((c) => c.source === '/(.*)')
    expect(rootHeaders).toBeDefined()

    const headersMap = new Map<string, string>()
    for (const h of rootHeaders!.headers) {
      headersMap.set(h.key.toLowerCase(), h.value)
    }

    // 1. X-Content-Type-Options: nosniff
    expect(headersMap.get('x-content-type-options')).toBe('nosniff')

    // 2. X-Frame-Options: DENY (Clickjacking defense)
    expect(headersMap.get('x-frame-options')).toBe('DENY')

    // 3. Referrer-Policy: strict-origin-when-cross-origin
    expect(headersMap.get('referrer-policy')).toBe('strict-origin-when-cross-origin')

    // 4. Permissions-Policy: camera=(), microphone=(), geolocation=()
    expect(headersMap.get('permissions-policy')).toContain('camera=()')
    expect(headersMap.get('permissions-policy')).toContain('microphone=()')

    // 5. Strict-Transport-Security
    expect(headersMap.get('strict-transport-security')).toContain('max-age=')
    expect(headersMap.get('strict-transport-security')).toContain('includeSubDomains')

    // 6. Content-Security-Policy
    const csp = headersMap.get('content-security-policy')
    expect(csp).toBeDefined()
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("base-uri 'self'")
  })
})
