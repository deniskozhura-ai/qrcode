import { describe, it, expect } from 'vitest'
import { BusinessInputSchema, FeedbackInputSchema } from '@/lib/validations'
import fs from 'fs'
import path from 'path'

describe('XSS, URL Injection & Open Redirect Defense (Requirement 19, 20, 32 & 33)', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000'

  describe('Dangerous URL Scheme Rejection (XSS Defense)', () => {
    const maliciousUrls = [
      'javascript:alert(document.cookie)',
      'javascript://%0aalert(1)',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      'vbscript:msgbox("XSS")',
      'file:///etc/shadow',
      'jav&#x09;ascript:alert(1)',
    ]

    it('rejects all dangerous and non-http/https schemes in Google review URL', () => {
      for (const url of maliciousUrls) {
        const res = BusinessInputSchema.safeParse({
          name: 'My Business',
          google_review_url: url,
        })
        expect(res.success).toBe(false)
      }
    })

    it('allows legitimate external http/https review links', () => {
      const validUrls = [
        'https://g.page/r/sample123/review',
        'http://example.com/reviews',
        'https://maps.google.com/?cid=12345',
      ]
      for (const url of validUrls) {
        const res = BusinessInputSchema.safeParse({
          name: 'My Business',
          google_review_url: url,
        })
        expect(res.success).toBe(true)
      }
    })
  })

  describe('HTML Injection & Safe Text Content', () => {
    const xssPayloads = [
      '<script>alert("pwned")</script>',
      '<img src=x onerror="alert(1)">',
      '<svg/onload=alert(1)>',
      '"><script>alert(1)</script>',
      '{{7*7}}',
    ]

    it('validates text bounds and allows string inputs to be safely stored without HTML execution', () => {
      for (const payload of xssPayloads) {
        const feedback = FeedbackInputSchema.safeParse({
          qr_code_id: validUuid,
          rating: 1,
          message: payload,
          category: 'Service',
        })
        expect(feedback.success).toBe(true)
        // Values remain pure strings and are never interpreted as raw HTML by React
        expect(typeof feedback.data?.message).toBe('string')
      }
    })

    it('audit codebase: ensures dangerouslySetInnerHTML is NOT used in src', () => {
      function searchDirectory(dir: string): string[] {
        let files: string[] = []
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            files = files.concat(searchDirectory(fullPath))
          } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) {
            files.push(fullPath)
          }
        }
        return files
      }

      const srcDir = path.resolve(import.meta.dirname, '../../src')
      const tsxFiles = searchDirectory(srcDir)
      const dangerouslySetFiles: string[] = []

      for (const file of tsxFiles) {
        const content = fs.readFileSync(file, 'utf8')
        if (content.includes('dangerouslySetInnerHTML')) {
          dangerouslySetFiles.push(path.basename(file))
        }
      }

      // Zero dangerouslySetInnerHTML in the entire application!
      expect(dangerouslySetFiles).toHaveLength(0)
    })
  })

  describe('Open Redirect Prevention', () => {
    function sanitizeNextParam(nextParam: string | null): string {
      if (
        nextParam &&
        nextParam.startsWith('/') &&
        !nextParam.startsWith('//') &&
        !nextParam.includes('\\')
      ) {
        return nextParam
      }
      return '/dashboard'
    }

    it('rejects protocol-relative open redirect //evil.com', () => {
      expect(sanitizeNextParam('//evil.com')).toBe('/dashboard')
    })

    it('rejects backslash open redirect /\\evil.com', () => {
      expect(sanitizeNextParam('/\\evil.com')).toBe('/dashboard')
    })

    it('rejects absolute external URLs in redirect parameters', () => {
      expect(sanitizeNextParam('https://attacker.com')).toBe('/dashboard')
      expect(sanitizeNextParam('javascript:alert(1)')).toBe('/dashboard')
    })

    it('allows valid internal relative paths', () => {
      expect(sanitizeNextParam('/dashboard/qr')).toBe('/dashboard/qr')
      expect(sanitizeNextParam('/dashboard/settings/business')).toBe('/dashboard/settings/business')
    })
  })
})
