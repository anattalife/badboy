import type { EmailAdapter, SendEmailOptions } from 'payload'

/**
 * Payload email adapter for Cloudflare Email Sending (the `send_email` Worker binding).
 * Outside the deployed Worker (local dev, Codespaces, tests) emails are written to the log
 * instead of being sent, so nothing leaves the machine during demos.
 */
type SendEmailBinding = {
  send: (message: {
    to: string | string[]
    from: string | { email: string; name?: string }
    replyTo?: string
    subject: string
    html?: string
    text?: string
  }) => Promise<{ messageId?: string }>
}

const addressOf = (value: SendEmailOptions['to']): string[] => {
  const list = Array.isArray(value) ? value : value ? [value] : []
  return list
    .map((v) => (typeof v === 'string' ? v : v?.address))
    .filter((v): v is string => Boolean(v))
}

export const cloudflareEmailAdapter =
  ({
    binding,
    send,
    fromAddress,
    fromName,
  }: {
    binding?: SendEmailBinding
    /** Only true inside the deployed Worker. */
    send: boolean
    fromAddress: string
    fromName: string
  }): EmailAdapter =>
  ({ payload }) => ({
    name: 'cloudflare-email',
    defaultFromAddress: fromAddress,
    defaultFromName: fromName,
    sendEmail: async (message) => {
      const to = addressOf(message.to)
      const subject = message.subject ?? '(no subject)'
      const replyTo = addressOf(message.replyTo as SendEmailOptions['to'])[0]

      if (!send || !binding) {
        payload.logger.info(
          `[email:log-only] To: ${to.join(', ')} | Subject: ${subject}\n${typeof message.text === 'string' ? message.text : '(html only)'}`,
        )
        return { logged: true }
      }

      return binding.send({
        to,
        from: { email: fromAddress, name: fromName },
        replyTo,
        subject,
        html: typeof message.html === 'string' ? message.html : undefined,
        text: typeof message.text === 'string' ? message.text : undefined,
      })
    },
  })

/** Escapes text for safe use inside HTML email bodies. */
export const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** Builds a plain, readable alert email from label/value rows. */
export function alertEmail(title: string, rows: [string, unknown][], adminUrl?: string) {
  const filled = rows.filter(([, v]) => v !== undefined && v !== null && v !== '')
  const text = [
    title,
    '',
    ...filled.map(([k, v]) => `${k}: ${v}`),
    ...(adminUrl ? ['', `Open in admin: ${adminUrl}`] : []),
  ].join('\n')
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1b2630">
<h2 style="color:#2f4a5c;margin:0 0 12px">${escapeHtml(title)}</h2>
<table cellpadding="6" style="border-collapse:collapse">${filled
    .map(
      ([k, v]) =>
        `<tr><td style="color:#5d6a73;vertical-align:top">${escapeHtml(k)}</td><td style="white-space:pre-line">${escapeHtml(v)}</td></tr>`,
    )
    .join('')}</table>
${adminUrl ? `<p style="margin-top:16px"><a href="${escapeHtml(adminUrl)}" style="color:#e8641b">Open in admin</a></p>` : ''}
</div>`
  return { text, html }
}
