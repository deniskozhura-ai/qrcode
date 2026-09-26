import { z } from 'zod'

/**
 * Valid Analytics Event Types
 */
export const VALID_ANALYTICS_EVENTS = [
  'qr_scan',
  'rating_submitted',
  'feedback_submitted',
  'feedback_copied',
  'google_review_clicked',
] as const

export type AnalyticsEventType = (typeof VALID_ANALYTICS_EVENTS)[number]

/**
 * Analytics Event API Validation Schema
 */
export const AnalyticsEventSchema = z.object({
  event_type: z.enum(VALID_ANALYTICS_EVENTS, {
    errorMap: () => ({ message: 'Invalid or unsupported event_type' }),
  }),
  qr_code_id: z.string().uuid('qr_code_id must be a valid UUID'),
  business_id: z.string().uuid('business_id must be a valid UUID').optional(),
  metadata: z.record(z.unknown()).optional(),
}).strict()

/**
 * Feedback Submission Validation Schema
 */
export const FeedbackInputSchema = z.object({
  qr_code_id: z.string().uuid('qr_code_id must be a valid UUID'),
  rating: z
    .number({ invalid_type_error: 'Rating must be a number' })
    .int('Rating must be an integer')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  category: z
    .string()
    .max(50, 'Category cannot exceed 50 characters')
    .nullable()
    .optional(),
  message: z
    .string()
    .max(1000, 'Message cannot exceed 1000 characters')
    .nullable()
    .optional(),
  business_id: z.string().uuid('business_id must be a valid UUID').optional(),
}).strict()

/**
 * URL validation helper: disallows javascript:, data:, etc.
 */
function isValidSafeUrl(val: string | null | undefined): boolean {
  if (!val || val.trim() === '') return true
  try {
    const parsed = new URL(val)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Business Settings / Creation Validation Schema
 */
export const BusinessInputSchema = z.object({
  name: z
    .string({ required_error: 'Business name is required' })
    .trim()
    .min(1, 'Business name is required')
    .max(100, 'Business name cannot exceed 100 characters'),
  google_review_url: z
    .string()
    .trim()
    .refine(isValidSafeUrl, {
      message: 'Google Review URL must be a valid URL with http:// or https:// protocol',
    })
    .nullable()
    .optional(),
  brand_color: z
    .string()
    .trim()
    .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Brand color must be a valid hex code (e.g. #18181b)')
    .default('#18181b'),
  timezone: z
    .string()
    .trim()
    .max(50, 'Timezone cannot exceed 50 characters')
    .default('UTC'),
  address: z
    .string()
    .trim()
    .max(255, 'Address cannot exceed 255 characters')
    .nullable()
    .optional(),
})

/**
 * QR Code Creation Schema
 */
export const CreateQrInputSchema = z.object({
  name: z
    .string({ required_error: 'QR code name is required' })
    .trim()
    .min(1, 'QR code name is required')
    .max(100, 'QR code name cannot exceed 100 characters'),
  business_id: z.string().uuid('business_id must be a valid UUID'),
})

/**
 * Lemon Squeezy Webhook Payload Validation Schema
 */
export const LemonSqueezyWebhookPayloadSchema = z.object({
  meta: z.object({
    event_name: z.string(),
    custom_data: z
      .object({
        user_id: z.string().uuid().optional(),
      })
      .optional()
      .nullable(),
  }),
  data: z.object({
    id: z.string().min(1, 'Event data ID is required'),
    attributes: z.object({
      product_id: z.union([z.string(), z.number()]),
      variant_id: z.union([z.string(), z.number()]),
      customer_id: z.union([z.string(), z.number()]),
      status: z.string(),
      trial_ends_at: z.string().nullable().optional(),
      renews_at: z.string().nullable().optional(),
      ends_at: z.string().nullable().optional(),
      created_at: z.string().optional(),
      cancelled: z.boolean().optional(),
    }),
  }),
})

export type LemonSqueezyWebhookPayload = z.infer<typeof LemonSqueezyWebhookPayloadSchema>
