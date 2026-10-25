/** Shared form-handling helpers (safe to import from server and client code). */

export type FieldErrors = Record<string, string>

export type FormState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fieldErrors?: FieldErrors }
  | { status: 'success'; message: string }

export const idle: FormState = { status: 'idle' }

/** Reads a trimmed string field, capped to a sane length. */
export const str = (form: FormData, name: string, max = 200) =>
  String(form.get(name) ?? '')
    .trim()
    .slice(0, max)

export const digits = (value: string) => value.replace(/\D/g, '')

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)

export const isPhone = (v: string) => {
  const d = digits(v)
  return d.length === 10 || (d.length === 11 && d.startsWith('1'))
}

export const isZip = (v: string) => /^\d{5}(-\d{4})?$/.test(v)

export const isSsn = (v: string) => {
  const d = digits(v)
  // Basic validity: 9 digits, no all-zero groups, area not 000/666/9xx.
  return (
    d.length === 9 &&
    !/^(000|666|9)/.test(d) &&
    d.slice(3, 5) !== '00' &&
    d.slice(5) !== '0000'
  )
}

export const formatSsn = (v: string) => {
  const d = digits(v)
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5, 9)}`
}

/** Parses YYYY-MM-DD and returns age in whole years, or null if invalid. */
export const ageFrom = (iso: string, now = new Date()): number | null => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (Number.isNaN(d.getTime()) || d.getDate() !== Number(m[3])) return null
  let age = now.getFullYear() - d.getFullYear()
  const birthdayPassed =
    now.getMonth() > d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() >= d.getDate())
  if (!birthdayPassed) age--
  return age
}

export const money = (v: string): number | null => {
  const cleaned = v.replace(/[$,\s]/g, '')
  if (!cleaned) return null
  const n = Number(cleaned)
  return Number.isFinite(n) && n >= 0 && n < 100_000_000 ? Math.round(n * 100) / 100 : null
}

export const int = (v: string, max = 99): number | null => {
  if (!v) return null
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 && n <= max ? n : null
}
