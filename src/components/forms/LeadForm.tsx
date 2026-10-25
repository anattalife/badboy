'use client'

import { startTransition, useActionState } from 'react'

import { submitLead } from '@/app/(frontend)/actions'
import { idle } from '@/lib/forms'

import { FormMessage, SelectField, SpamGuard, TextAreaField, TextField } from './Fields'

export type LeadFormProps = {
  type: 'quote' | 'trade-in' | 'contact'
  modelSlug?: string
  stockNumber?: string
  subject?: string | null
  page: string
  siteKey: string | null
  renderedAt: number
}

function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60 sm:w-auto">
      {pending ? 'Sending…' : label}
    </button>
  )
}

const CONTACT_OPTIONS = [
  { value: 'phone', label: 'Phone call' },
  { value: 'text', label: 'Text message' },
  { value: 'email', label: 'Email' },
]

export function LeadForm({ type, modelSlug, stockNumber, subject, page, siteKey, renderedAt }: LeadFormProps) {
  const [state, dispatch, pending] = useActionState(submitLead, idle)
  const err = state.status === 'error' ? (state.fieldErrors ?? {}) : {}

  if (state.status === 'success') {
    return (
      <div className="space-y-4">
        <FormMessage state={state} />
        <p className="text-steel">Need an answer sooner? Give us a call during business hours.</p>
      </div>
    )
  }

  const submitLabel = { quote: 'Request my quote', 'trade-in': 'Get my trade-in value', contact: 'Send message' }[type]

  return (
    <form
      // Submitted manually (not via `action`) so React doesn't clear the fields when validation fails.
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        startTransition(() => dispatch(data))
      }}
      className="relative space-y-5"
      noValidate
    >
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="page" value={page} />
      {modelSlug ? <input type="hidden" name="model" value={modelSlug} /> : null}
      {stockNumber ? <input type="hidden" name="unit" value={stockNumber} /> : null}

      <FormMessage state={state} />

      {subject ? (
        <p className="rounded-[var(--radius-plate)] bg-fescue px-4 py-3">
          <span className="text-steel">About: </span>
          <strong>{subject}</strong>
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label="Your name" required autoComplete="name" error={err.name} className="sm:col-span-2" />
        <TextField name="phone" label="Phone" type="tel" autoComplete="tel" inputMode="tel" error={err.phone} />
        <TextField name="email" label="Email" type="email" autoComplete="email" error={err.email} />
        <SelectField name="preferredContact" label="Best way to reach you" options={CONTACT_OPTIONS} placeholder="No preference" />
        <TextField name="zip" label="ZIP code" inputMode="numeric" autoComplete="postal-code" maxLength={10} error={err.zip} />
      </div>
      <p className="-mt-2 text-sm text-steel">We need a phone number or an email to get back to you.</p>

      {type === 'quote' ? (
        <SelectField
          name="timeframe"
          label="When are you looking to buy?"
          options={[
            { value: 'now', label: 'Ready now' },
            { value: 'month', label: 'Within a month' },
            { value: 'researching', label: 'Just researching' },
          ]}
        />
      ) : null}

      {type === 'trade-in' ? (
        <fieldset className="space-y-5 rounded-[var(--radius-plate)] border border-haze p-5">
          <legend className="px-1 font-bold text-ink [font-variation-settings:'wdth'_110]">Your trade-in</legend>
          <div className="grid gap-5 sm:grid-cols-4">
            <TextField name="tradeYear" label="Year" required inputMode="numeric" maxLength={4} error={err.tradeYear} />
            <TextField name="tradeMake" label="Make" required placeholder="e.g. Bad Boy" error={err.tradeMake} />
            <TextField name="tradeModel" label="Model" required error={err.tradeModel} />
            <TextField name="tradeHours" label="Hours" inputMode="numeric" />
          </div>
          <SelectField
            name="tradeCondition"
            label="Overall condition"
            options={[
              { value: 'excellent', label: 'Excellent' },
              { value: 'good', label: 'Good' },
              { value: 'fair', label: 'Fair' },
              { value: 'needs-work', label: 'Needs work' },
            ]}
          />
          <TextAreaField
            name="tradeDetails"
            label="Anything we should know?"
            placeholder="Deck size, recent repairs, attachments included…"
          />
          <p className="text-sm text-steel">We may ask you to text a few photos so we can give you an accurate number.</p>
        </fieldset>
      ) : null}

      <TextAreaField
        name="message"
        label={type === 'contact' ? 'How can we help?' : 'Questions or details'}
        required={type === 'contact'}
        error={err.message}
      />

      <SpamGuard siteKey={siteKey} renderedAt={renderedAt} state={state} />

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton label={submitLabel} pending={pending} />
      </div>
    </form>
  )
}
