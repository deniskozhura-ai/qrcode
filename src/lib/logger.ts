/**
 * Structured Security Logger
 *
 * Provides consistent, structured server-side logging without leaking PII,
 * credentials, or sensitive data. All logs are scrubbed before output.
 *
 * In production (Vercel / cloud), logs appear in the platform's log drain.
 * Swap `console` calls with a proper log drain (Axiom, Datadog, etc.) as needed.
 */

type LogLevel = 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: string | number | boolean | null | undefined
}

// Fields that must never appear in logs
const REDACTED_KEYS = new Set([
  'password',
  'passwd',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'authorization',
  'x-api-key',
  'service_role',
  'serviceRole',
  'webhook_secret',
  'private_key',
  'credit_card',
  'cvv',
  'ssn',
])

function scrubContext(ctx: LogContext): LogContext {
  const safe: LogContext = {}
  for (const [k, v] of Object.entries(ctx)) {
    if (REDACTED_KEYS.has(k.toLowerCase())) {
      safe[k] = '[REDACTED]'
    } else {
      safe[k] = v
    }
  }
  return safe
}

function emit(level: LogLevel, event: string, context: LogContext = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...scrubContext(context),
  }
  const line = JSON.stringify(entry)
  if (level === 'error') {
    console.error(line)
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    console.info(line)
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

export const logger = {
  info: (event: string, ctx?: LogContext) => emit('info', event, ctx),
  warn: (event: string, ctx?: LogContext) => emit('warn', event, ctx),
  error: (event: string, ctx?: LogContext) => emit('error', event, ctx),

  // Convenience methods for common security events
  authFailure: (reason: string, ctx?: LogContext) =>
    emit('warn', 'auth.failure', { reason, ...ctx }),

  rateLimitHit: (limiter: string, ctx?: LogContext) =>
    emit('warn', 'rate_limit.exceeded', { limiter, ...ctx }),

  bolaAttempt: (resource: string, ctx?: LogContext) =>
    emit('warn', 'bola.attempt', { resource, ...ctx }),

  webhookInvalid: (reason: string, ctx?: LogContext) =>
    emit('warn', 'webhook.invalid', { reason, ...ctx }),

  webhookProcessed: (eventId: string, eventType: string, ctx?: LogContext) =>
    emit('info', 'webhook.processed', { eventId, eventType, ...ctx }),

  subscriptionEvent: (eventType: string, userId: string, ctx?: LogContext) =>
    emit('info', 'subscription.event', { eventType, userId, ...ctx }),
}
