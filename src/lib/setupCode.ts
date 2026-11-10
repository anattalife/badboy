/** Setup-code checks for the setup wizard. No server-only import so tests can load it. */

/**
 * The live site requires the SETUP_CODE secret to run the wizard, so a stranger who finds a new
 * site before the dealer can't claim it. Local and Codespaces demos only need it if it's set.
 */
export const setupCodeRequired = () =>
  process.env.NODE_ENV === 'production' || Boolean(process.env.SETUP_CODE)

/** Constant-time comparison so the code can't be guessed a character at a time. */
export function setupCodeMatches(input: string): boolean {
  if (!setupCodeRequired()) return true
  const expected = process.env.SETUP_CODE ?? ''
  if (expected.length < 12) return false // not configured, or too short to be safe
  const a = new TextEncoder().encode(input)
  const b = new TextEncoder().encode(expected)
  let diff = a.length ^ b.length
  for (let i = 0; i < b.length; i++) diff |= (a[i] ?? 0) ^ b[i]
  return diff === 0
}
