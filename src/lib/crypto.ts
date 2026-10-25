/**
 * Field-level encryption for sensitive applicant data (SSN, date of birth, income).
 *
 * AES-256-GCM via the Web Crypto API, which runs the same on Cloudflare Workers and Node.
 * The key comes from FIELD_ENCRYPTION_KEY (32 random bytes, base64). Stored values look like
 * `enc:v1:<iv>:<ciphertext>` so the format can change later without breaking old records.
 *
 * Generate a key with:  openssl rand -base64 32
 */

const PREFIX = 'enc:v1:'

const toB64 = (bytes: Uint8Array) => {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

let cachedKey: { raw: string; key: CryptoKey } | null = null

async function getKey(): Promise<CryptoKey> {
  const raw = process.env.FIELD_ENCRYPTION_KEY
  if (!raw) {
    throw new Error(
      'FIELD_ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32` and add it as a secret.',
    )
  }
  if (cachedKey?.raw === raw) return cachedKey.key
  const bytes = fromB64(raw)
  if (bytes.length !== 32) throw new Error('FIELD_ENCRYPTION_KEY must be 32 bytes, base64-encoded.')
  const key = await crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])
  cachedKey = { raw, key }
  return key
}

export const isEncrypted = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith(PREFIX)

export const hasEncryptionKey = () => Boolean(process.env.FIELD_ENCRYPTION_KEY)

export async function encrypt(plain: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain))
  return `${PREFIX}${toB64(iv)}:${toB64(new Uint8Array(ct))}`
}

export async function decrypt(stored: string): Promise<string> {
  if (!isEncrypted(stored)) return stored as string
  const [ivB64, ctB64] = stored.slice(PREFIX.length).split(':')
  const key = await getKey()
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(ivB64) }, key, fromB64(ctB64))
  return new TextDecoder().decode(pt)
}

/** Masked display value, e.g. `•••-••-1234`. Never reveals more than the last 4 characters. */
export function mask(plain: string | null | undefined, kind: 'ssn' | 'date' | 'money' = 'ssn'): string {
  if (!plain) return ''
  if (kind === 'ssn') return `•••-••-${plain.replace(/\D/g, '').slice(-4)}`
  if (kind === 'date') return '••/••/••••'
  return '$•••••'
}

export const MASK_CHAR = '•'
