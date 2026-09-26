import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

describe('Repository Secrets & Credentials Static Audit (Requirement 23 & 34)', () => {
  it('verifies that no secret API keys or private credentials exist in tracked git files', () => {
    // 1. Get all files tracked by git
    const trackedFilesOutput = execSync('git ls-files', { encoding: 'utf8' })
    const trackedFiles = trackedFilesOutput
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0)

    // Ensure we actually found tracked files
    expect(trackedFiles.length).toBeGreaterThan(10)

    // 2. Sensitive keys that MUST NOT have real assigned values in tracked repository files
    const sensitivePatterns = [
      /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]?[a-zA-Z0-9_\-\.]{15,}['"]?/,
      /LEMONSQUEEZY_API_KEY\s*=\s*['"]?[a-zA-Z0-9_\-\.]{15,}['"]?/,
      /LEMONSQUEEZY_WEBHOOK_SECRET\s*=\s*['"]?[a-zA-Z0-9_\-\.]{15,}['"]?/,
      /RESEND_API_KEY\s*=\s*['"]?re_[a-zA-Z0-9_]{15,}['"]?/,
      /STRIPE_SECRET_KEY\s*=\s*['"]?sk_[a-zA-Z0-9_]{15,}['"]?/,
    ]

    const violations: { file: string; line: string }[] = []

    for (const relativePath of trackedFiles) {
      // Exclude binary files or this test itself
      if (relativePath.includes('secrets.test.ts')) continue

      const fullPath = path.resolve(process.cwd(), relativePath)
      if (!fs.existsSync(fullPath)) continue

      const content = fs.readFileSync(fullPath, 'utf8')
      const lines = content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        for (const pattern of sensitivePatterns) {
          if (pattern.test(line)) {
            violations.push({ file: relativePath, line: line.trim() })
          }
        }
      }
    }

    // Zero secret violations in tracked files!
    expect(violations).toEqual([])
  })

  it('verifies .env.example contains only empty placeholders', () => {
    const envExamplePath = path.resolve(process.cwd(), '.env.example')
    expect(fs.existsSync(envExamplePath)).toBe(true)

    const content = fs.readFileSync(envExamplePath, 'utf8')
    // Must not have actual secrets assigned
    expect(content).not.toMatch(/sb_secret_/)
    expect(content).not.toMatch(/sk_live_/)
    expect(content).not.toMatch(/re_[0-9a-zA-Z]{10,}/)
  })

  it('verifies .env.local is in .gitignore', () => {
    const gitignorePath = path.resolve(process.cwd(), '.gitignore')
    const content = fs.readFileSync(gitignorePath, 'utf8')
    expect(content).toMatch(/\.env\*/)
  })
})
