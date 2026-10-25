'use client'

import Script from 'next/script'
import { useEffect, useId, useRef } from 'react'

import type { FormState } from '@/lib/forms'

const inputClass =
  'mt-1.5 block w-full rounded-[var(--radius-plate)] border bg-white px-3 py-2.5 text-ink placeholder:text-steel-light focus:border-ridge focus:outline-none focus:ring-2 focus:ring-ridge/25'

type Common = {
  name: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
}

export function TextField({
  name,
  label,
  error,
  hint,
  required,
  className = '',
  ...input
}: Common & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  const describedBy = [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required ? <span className="text-signal"> *</span> : <span className="font-normal text-steel"> (optional)</span>}
      </label>
      <input
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${inputClass} ${error ? 'border-signal' : 'border-steel-light'}`}
        {...input}
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-steel">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-err`} className="mt-1 text-sm font-medium text-signal-deep">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function SelectField({
  name,
  label,
  error,
  hint,
  required,
  className = '',
  options,
  placeholder = 'Choose one',
  ...select
}: Common & { options: { value: string; label: string }[]; placeholder?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required ? <span className="text-signal"> *</span> : <span className="font-normal text-steel"> (optional)</span>}
      </label>
      <select
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className={`${inputClass} ${error ? 'border-signal' : 'border-steel-light'}`}
        defaultValue=""
        {...select}
      >
        <option value="" disabled={required}>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-steel">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-err`} className="mt-1 text-sm font-medium text-signal-deep">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function TextAreaField({
  name,
  label,
  error,
  required,
  className = '',
  ...area
}: Common & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required ? <span className="text-signal"> *</span> : <span className="font-normal text-steel"> (optional)</span>}
      </label>
      <textarea
        id={id}
        name={name}
        required={required}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`${inputClass} ${error ? 'border-signal' : 'border-steel-light'}`}
        {...area}
      />
      {error ? (
        <p id={`${id}-err`} className="mt-1 text-sm font-medium text-signal-deep">
          {error}
        </p>
      ) : null}
    </div>
  )
}

declare global {
  interface Window {
    turnstile?: { reset: (el?: string | HTMLElement) => void }
  }
}

/**
 * Hidden anti-spam fields plus the Cloudflare Turnstile widget (when a site key is set).
 * Turnstile tokens are single-use, so the widget resets after a failed submit.
 */
export function SpamGuard({
  siteKey,
  renderedAt,
  state,
}: {
  siteKey: string | null
  renderedAt: number
  state: FormState
}) {
  useEffect(() => {
    if (state.status === 'error') window.turnstile?.reset()
  }, [state])

  return (
    <>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="rendered_at" value={renderedAt} />
      {siteKey ? (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
          <div className="cf-turnstile" data-sitekey={siteKey} data-theme="light" />
        </>
      ) : null}
    </>
  )
}

export function FormMessage({ state }: { state: FormState }) {
  const ref = useRef<HTMLDivElement>(null)
  // Bring the result into view: on long forms the message can be far above the submit button.
  useEffect(() => {
    if (state.status === 'idle' || !ref.current) return
    ref.current.focus({ preventScroll: true })
    ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [state])

  if (state.status === 'idle') return null
  const ok = state.status === 'success'
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={ok ? 'status' : 'alert'}
      className={`rounded-[var(--radius-plate)] border-l-4 p-4 ${
        ok ? 'border-field bg-[#eef3e8] text-ink' : 'border-signal bg-[#fff1e8] text-ink'
      }`}
    >
      <p className="font-semibold">{state.message}</p>
    </div>
  )
}
