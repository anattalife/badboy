import 'server-only'

/**
 * Spam protection for public forms:
 * - Cloudflare Turnstile (when keys are configured; required in production)
 * - a hidden honeypot field bots tend to fill in
 * - a minimum time between page load and submit
 */

export const HONEYPOT_FIELD = 'company_website'
export const RENDERED_AT_FIELD = 'rendered_at'
const MIN_FILL_MS = 2500

export const turnstileSiteKey = () => process.env.TURNSTILE_SITE_KEY || null

type CheckResult = { ok: true } | { ok: false; reason: string }

export async function checkSpam(form: FormData, ip: string | null): Promise<CheckResult> {
  if (String(form.get(HONEYPOT_FIELD) ?? '').trim()) return { ok: false, reason: 'honeypot' }

  const renderedAt = Number(form.get(RENDERED_AT_FIELD))
  if (!renderedAt || Date.now() - renderedAt < MIN_FILL_MS) return { ok: false, reason: 'too-fast' }

  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    // Fail closed in production: forms must not run unprotected on the live site.
    if (process.env.NODE_ENV === 'production') return { ok: false, reason: 'turnstile-not-configured' }
    return { ok: true }
  }

  const token = String(form.get('cf-turnstile-response') ?? '')
  if (!token) return { ok: false, reason: 'turnstile-missing' }

  const body = new FormData()
  body.append('secret', secret)
  body.append('response', token)
  if (ip) body.append('remoteip', ip)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success ? { ok: true } : { ok: false, reason: 'turnstile-failed' }
  } catch {
    return { ok: false, reason: 'turnstile-unreachable' }
  }
}

/** Timestamp embedded in a form when the page renders (checked by `checkSpam`). */
export const formRenderedAt = () => Date.now()
