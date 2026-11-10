import type { TextField } from 'payload'

import { isAdminField } from '../access/roles'
import { decrypt, encrypt, isEncrypted } from '../lib/crypto'

/**
 * A key or password for an outside service (UPS, Stripe), typed into the admin by the dealer.
 *
 * - Stored encrypted (FIELD_ENCRYPTION_KEY), so a copy of the database doesn't expose it.
 * - Only admins can see or change it.
 * - Never sent back to the browser: the admin shows "Saved ••••1234". Saving the form with that
 *   placeholder keeps the stored key; clearing the box removes it.
 * - Server code reads the real value with `context: { rawSecrets: true }` (see src/lib/connections.ts).
 */
export const MASK_PREFIX = 'Saved ••••'

export const maskSecret = (plain: string) => `${MASK_PREFIX}${plain.slice(-4)}`

export function secretField(
  name: string,
  label: string,
  admin: TextField['admin'] = {},
  validate?: (plain: string) => string | true,
): TextField {
  return {
    name,
    label,
    type: 'text',
    access: { read: isAdminField, update: isAdminField },
    admin: { autoComplete: 'off', ...admin },
    validate: (value: unknown) => {
      if (typeof value !== 'string' || !value || value.startsWith(MASK_PREFIX) || isEncrypted(value)) return true
      return validate ? validate(value.trim()) : true
    },
    hooks: {
      beforeChange: [
        async ({ value, global, path, req }) => {
          // The previous value Payload passes in has been through afterRead (masked), so the stored
          // ciphertext is read straight from the database instead.
          const stored = async () => {
            if (!global) return null
            const raw = (await req.payload.findGlobal({
              slug: global.slug as 'store-settings',
              overrideAccess: true,
              depth: 0,
              // No `req` on purpose: passing it would copy rawSecrets into this request's context and
              // unmask the response.
              context: { rawSecrets: true },
            })) as unknown as Record<string, unknown>
            let node: unknown = raw
            for (const key of path) node = (node as Record<string, unknown> | undefined)?.[String(key)]
            return typeof node === 'string' && isEncrypted(node) ? node : null
          }
          if (value === undefined || value === null || typeof value !== 'string') return stored()
          const trimmed = value.trim()
          if (!trimmed) return null
          if (trimmed.startsWith(MASK_PREFIX) || isEncrypted(trimmed)) return stored()
          return encrypt(trimmed)
        },
      ],
      afterRead: [
        async ({ value, req }) => {
          if (typeof value !== 'string' || !value) return value
          if (req.context?.rawSecrets === true) return value
          try {
            return maskSecret(await decrypt(value))
          } catch {
            return `${MASK_PREFIX}????`
          }
        },
      ],
    },
  }
}
