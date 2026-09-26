/**
 * Safe client IP extraction utility
 * 
 * IMPORTANT SECURITY NOTE:
 * Client-supplied headers like X-Forwarded-For can be spoofed unless your application
 * is running behind a trusted reverse proxy (like Vercel, Cloudflare, or AWS ALB)
 * that strips or appends untrusted client headers.
 * 
 * Never use client IP as an authentication or authorization credential.
 * IP should strictly be used as an abuse-prevention / rate-limiting signal.
 */

// Simple IPv4 / IPv6 format validator
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
const IPV6_REGEX = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i

export function isValidIp(ip: string): boolean {
  return IPV4_REGEX.test(ip) || IPV6_REGEX.test(ip) || ip === '::1' || ip === '127.0.0.1'
}

/**
 * Extracts a normalized, validated client IP from HTTP Request headers.
 */
export function getClientIp(req: Request): string {
  const headers = req.headers

  // 1. Vercel edge proxy header (secure on Vercel deployment)
  const vercelIp = headers.get('x-vercel-forwarded-for')
  if (vercelIp) {
    const candidate = vercelIp.split(',')[0].trim()
    if (isValidIp(candidate)) return candidate
  }

  // 2. Cloudflare Connecting IP
  const cfIp = headers.get('cf-connecting-ip')
  if (cfIp) {
    const candidate = cfIp.trim()
    if (isValidIp(candidate)) return candidate
  }

  // 3. X-Real-IP (standard Nginx / proxy header)
  const realIp = headers.get('x-real-ip')
  if (realIp) {
    const candidate = realIp.trim()
    if (isValidIp(candidate)) return candidate
  }

  // 4. Standard X-Forwarded-For (take the first IP in the chain, validate it)
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((s) => s.trim())
    for (const ip of ips) {
      if (isValidIp(ip)) {
        return ip
      }
    }
  }

  return '127.0.0.1'
}

/**
 * Extracts normalized, validated client IP within Next.js Server Actions.
 */
export async function getServerActionClientIp(): Promise<string> {
  try {
    const { headers } = await import('next/headers')
    const headerList = await headers()

    const vercelIp = headerList.get('x-vercel-forwarded-for')
    if (vercelIp) {
      const candidate = vercelIp.split(',')[0].trim()
      if (isValidIp(candidate)) return candidate
    }

    const cfIp = headerList.get('cf-connecting-ip')
    if (cfIp) {
      const candidate = cfIp.trim()
      if (isValidIp(candidate)) return candidate
    }

    const realIp = headerList.get('x-real-ip')
    if (realIp) {
      const candidate = realIp.trim()
      if (isValidIp(candidate)) return candidate
    }

    const forwardedFor = headerList.get('x-forwarded-for')
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map((s) => s.trim())
      for (const ip of ips) {
        if (isValidIp(ip)) return ip
      }
    }
  } catch {
    // In non-server-action or test environments where headers() is unavailable
  }

  return '127.0.0.1'
}
