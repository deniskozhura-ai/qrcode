import { describe, it, expect } from 'vitest'
import {
  FeedbackInputSchema,
  AnalyticsEventSchema,
  BusinessInputSchema,
  CreateQrInputSchema,
} from '@/lib/validations'

describe('Input Validation & Boundary Testing (Requirement 8 & 28)', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000'

  describe('FeedbackInputSchema', () => {
    it('accepts valid ratings 1 through 5', () => {
      for (let r = 1; r <= 5; r++) {
        const res = FeedbackInputSchema.safeParse({
          qr_code_id: validUuid,
          rating: r,
          message: 'Good service',
        })
        expect(res.success).toBe(true)
      }
    })

    it('rejects rating = 0', () => {
      const res = FeedbackInputSchema.safeParse({ qr_code_id: validUuid, rating: 0 })
      expect(res.success).toBe(false)
    })

    it('rejects rating = 6', () => {
      const res = FeedbackInputSchema.safeParse({ qr_code_id: validUuid, rating: 6 })
      expect(res.success).toBe(false)
    })

    it('rejects non-integer rating = 1.5', () => {
      const res = FeedbackInputSchema.safeParse({ qr_code_id: validUuid, rating: 1.5 })
      expect(res.success).toBe(false)
    })

    it('rejects string rating = "5"', () => {
      const res = FeedbackInputSchema.safeParse({ qr_code_id: validUuid, rating: '5' })
      expect(res.success).toBe(false)
    })

    it('rejects null rating', () => {
      const res = FeedbackInputSchema.safeParse({ qr_code_id: validUuid, rating: null })
      expect(res.success).toBe(false)
    })

    it('accepts message with exactly 1000 characters', () => {
      const longMessage = 'a'.repeat(1000)
      const res = FeedbackInputSchema.safeParse({
        qr_code_id: validUuid,
        rating: 5,
        message: longMessage,
      })
      expect(res.success).toBe(true)
    })

    it('rejects message with 1001 characters', () => {
      const tooLongMessage = 'a'.repeat(1001)
      const res = FeedbackInputSchema.safeParse({
        qr_code_id: validUuid,
        rating: 5,
        message: tooLongMessage,
      })
      expect(res.success).toBe(false)
    })

    it('rejects category over 50 characters', () => {
      const res = FeedbackInputSchema.safeParse({
        qr_code_id: validUuid,
        rating: 4,
        category: 'c'.repeat(51),
      })
      expect(res.success).toBe(false)
    })

    it('rejects malformed qr_code_id (not a UUID)', () => {
      const res = FeedbackInputSchema.safeParse({
        qr_code_id: 'not-a-valid-uuid',
        rating: 4,
      })
      expect(res.success).toBe(false)
    })

    it('rejects extra unknown properties (strict mode)', () => {
      const res = FeedbackInputSchema.safeParse({
        qr_code_id: validUuid,
        rating: 4,
        isAdmin: true,
      })
      expect(res.success).toBe(false)
    })
  })

  describe('AnalyticsEventSchema', () => {
    it('accepts whitelisted event types', () => {
      const events = [
        'qr_scan',
        'rating_submitted',
        'feedback_submitted',
        'feedback_copied',
        'google_review_clicked',
      ]
      for (const ev of events) {
        const res = AnalyticsEventSchema.safeParse({
          event_type: ev,
          qr_code_id: validUuid,
        })
        expect(res.success).toBe(true)
      }
    })

    it('rejects unknown/arbitrary event types', () => {
      const invalidEvents = ['admin_login', 'sql_injection', '', 'drop_database', 'user_promoted']
      for (const ev of invalidEvents) {
        const res = AnalyticsEventSchema.safeParse({
          event_type: ev,
          qr_code_id: validUuid,
        })
        expect(res.success).toBe(false)
      }
    })

    it('rejects invalid qr_code_id in analytics', () => {
      const res = AnalyticsEventSchema.safeParse({
        event_type: 'qr_scan',
        qr_code_id: '12345',
      })
      expect(res.success).toBe(false)
    })
  })

  describe('BusinessInputSchema', () => {
    it('rejects empty or whitespace-only business name', () => {
      expect(BusinessInputSchema.safeParse({ name: '' }).success).toBe(false)
      expect(BusinessInputSchema.safeParse({ name: '   ' }).success).toBe(false)
    })

    it('rejects business name longer than 100 characters', () => {
      expect(BusinessInputSchema.safeParse({ name: 'n'.repeat(101) }).success).toBe(false)
    })

    it('accepts valid hex colors', () => {
      expect(BusinessInputSchema.safeParse({ name: 'Coffee', brand_color: '#18181b' }).success).toBe(true)
      expect(BusinessInputSchema.safeParse({ name: 'Coffee', brand_color: '#fff' }).success).toBe(true)
      expect(BusinessInputSchema.safeParse({ name: 'Coffee', brand_color: '#3b82f6' }).success).toBe(true)
    })

    it('rejects invalid hex color format or CSS injection', () => {
      expect(BusinessInputSchema.safeParse({ name: 'Coffee', brand_color: 'red' }).success).toBe(false)
      expect(BusinessInputSchema.safeParse({ name: 'Coffee', brand_color: 'rgb(0,0,0)' }).success).toBe(false)
      expect(BusinessInputSchema.safeParse({ name: 'Coffee', brand_color: '<script>' }).success).toBe(false)
      expect(BusinessInputSchema.safeParse({ name: 'Coffee', brand_color: '#1234567' }).success).toBe(false)
    })

    it('accepts legitimate https Google review URLs', () => {
      const res = BusinessInputSchema.safeParse({
        name: 'Coffee',
        google_review_url: 'https://g.page/r/sample/review',
      })
      expect(res.success).toBe(true)
    })

    it('rejects dangerous URL schemes (javascript:, data:)', () => {
      const dangerousUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        'file:///etc/passwd',
      ]
      for (const url of dangerousUrls) {
        const res = BusinessInputSchema.safeParse({
          name: 'Coffee',
          google_review_url: url,
        })
        expect(res.success).toBe(false)
      }
    })
  })

  describe('CreateQrInputSchema', () => {
    it('validates QR name and UUID business_id', () => {
      expect(CreateQrInputSchema.safeParse({ name: 'Bar Counter', business_id: validUuid }).success).toBe(true)
      expect(CreateQrInputSchema.safeParse({ name: '', business_id: validUuid }).success).toBe(false)
      expect(CreateQrInputSchema.safeParse({ name: 'Table 1', business_id: 'invalid-id' }).success).toBe(false)
    })
  })
})
