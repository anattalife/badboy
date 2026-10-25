'use client'

import { startTransition, useActionState, useState } from 'react'

import { submitCreditApplication } from '@/app/(frontend)/actions'
import { type FieldErrors, idle } from '@/lib/forms'

import { FormMessage, SelectField, SpamGuard, TextField } from './Fields'

const HOUSING = [
  { value: 'own', label: 'Own' },
  { value: 'rent', label: 'Rent' },
  { value: 'family', label: 'Live with family' },
  { value: 'other', label: 'Other' },
]
const EMPLOYMENT = [
  { value: 'employed', label: 'Employed' },
  { value: 'self-employed', label: 'Self-employed' },
  { value: 'retired', label: 'Retired' },
  { value: 'other', label: 'Other' },
]

function Section({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <fieldset className="space-y-5 rounded-[var(--radius-plate)] border border-haze bg-white p-5 sm:p-7">
      <legend className="type-decal-md px-1 text-xl text-ridge">{title}</legend>
      {note ? <p className="-mt-2 text-sm text-steel">{note}</p> : null}
      {children}
    </fieldset>
  )
}

function PersonFields({ prefix, err }: { prefix: 'applicant' | 'coApplicant'; err: FieldErrors }) {
  const n = (name: string) => `${prefix}.${name}`
  const e = (name: string) => err[n(name)]
  const ac = (token: string) => (prefix === 'applicant' ? token : 'off')

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-[1fr_6rem_1fr]">
        <TextField name={n('firstName')} label="First name" required autoComplete={ac('given-name')} error={e('firstName')} />
        <TextField name={n('middleInitial')} label="M.I." maxLength={1} autoComplete={ac('additional-name')} />
        <TextField name={n('lastName')} label="Last name" required autoComplete={ac('family-name')} error={e('lastName')} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name={n('email')} label="Email" type="email" required autoComplete={ac('email')} error={e('email')} />
        <TextField name={n('phone')} label="Mobile phone" type="tel" required inputMode="tel" autoComplete={ac('tel')} error={e('phone')} />
        <TextField
          name={n('ssn')}
          label="Social Security number"
          required
          inputMode="numeric"
          autoComplete="off"
          maxLength={11}
          placeholder="123-45-6789"
          hint="Encrypted before it’s stored. Only our finance team can see it."
          error={e('ssn')}
        />
        <TextField name={n('dateOfBirth')} label="Date of birth" type="date" required autoComplete={ac('bday')} error={e('dateOfBirth')} />
      </div>

      <h3 className="pt-2 font-bold text-ink [font-variation-settings:'wdth'_110]">Home address</h3>
      <TextField name={n('street')} label="Street address" required autoComplete={ac('street-address')} error={e('street')} />
      <div className="grid gap-5 sm:grid-cols-[1fr_6rem_8rem]">
        <TextField name={n('city')} label="City" required autoComplete={ac('address-level2')} error={e('city')} />
        <TextField name={n('state')} label="State" required maxLength={2} defaultValue="VA" autoComplete={ac('address-level1')} error={e('state')} />
        <TextField name={n('zip')} label="ZIP" required inputMode="numeric" maxLength={10} autoComplete={ac('postal-code')} error={e('zip')} />
      </div>
      <div className="grid gap-5 sm:grid-cols-4">
        <TextField name={n('yearsAtAddress')} label="Years there" required inputMode="numeric" maxLength={2} error={e('yearsAtAddress')} />
        <TextField name={n('monthsAtAddress')} label="Months" inputMode="numeric" maxLength={2} />
        <SelectField name={n('housing')} label="Housing" required options={HOUSING} error={e('housing')} />
        <TextField name={n('monthlyHousingPayment')} label="Monthly payment" inputMode="decimal" placeholder="$" />
      </div>

      <h3 className="pt-2 font-bold text-ink [font-variation-settings:'wdth'_110]">Employment and income</h3>
      <div className="grid gap-5 sm:grid-cols-3">
        <SelectField name={n('employmentStatus')} label="Status" required options={EMPLOYMENT} error={e('employmentStatus')} />
        <TextField
          name={n('employer')}
          label="Employer or business"
          hint="Required if employed or self-employed."
          autoComplete={ac('organization')}
          error={e('employer')}
        />
        <TextField name={n('jobTitle')} label="Job title" autoComplete={ac('organization-title')} />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <TextField name={n('employerPhone')} label="Employer phone" type="tel" inputMode="tel" error={e('employerPhone')} />
        <TextField name={n('yearsEmployed')} label="Years there" inputMode="numeric" maxLength={2} />
        <TextField name={n('monthsEmployed')} label="Months" inputMode="numeric" maxLength={2} />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <TextField
          name={n('monthlyIncome')}
          label="Gross monthly income"
          required
          inputMode="decimal"
          placeholder="$"
          hint="Before taxes. Encrypted."
          error={e('monthlyIncome')}
        />
        <TextField name={n('otherMonthlyIncome')} label="Other monthly income" inputMode="decimal" placeholder="$" />
        <TextField name={n('otherIncomeSource')} label="Source of other income" />
      </div>
    </>
  )
}

export function CreditApplicationForm({
  modelSlug,
  stockNumber,
  subject,
  suggestedPrice,
  consentText,
  siteKey,
  renderedAt,
}: {
  modelSlug?: string
  stockNumber?: string
  subject?: string | null
  suggestedPrice?: number | null
  consentText: string
  siteKey: string | null
  renderedAt: number
}) {
  const [state, dispatch, pending] = useActionState(submitCreditApplication, idle)
  const [coApplicant, setCoApplicant] = useState(false)
  const err = state.status === 'error' ? (state.fieldErrors ?? {}) : {}

  if (state.status === 'success') {
    return (
      <div className="max-w-2xl space-y-4">
        <FormMessage state={state} />
        <p className="text-steel">
          For your security we don’t email application details. If you need to update anything, call us and
          ask for the finance team.
        </p>
      </div>
    )
  }

  return (
    <form
      // Submitted manually so React keeps what the applicant typed if a field needs fixing.
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        startTransition(() => dispatch(data))
      }}
      autoComplete="on"
      className="relative space-y-8"
      noValidate
    >
      {modelSlug ? <input type="hidden" name="model" value={modelSlug} /> : null}
      {stockNumber ? <input type="hidden" name="unit" value={stockNumber} /> : null}

      <FormMessage state={state} />

      <Section title="What you’re financing">
        {subject ? (
          <p className="rounded-[var(--radius-plate)] bg-fescue px-4 py-3">
            <strong>{subject}</strong>
          </p>
        ) : null}
        <TextField
          name="equipmentDescription"
          label={subject ? 'Anything else to include?' : 'Equipment'}
          required={!subject}
          placeholder={subject ? 'e.g. mulch kit, bagger' : 'e.g. Bad Boy Maverick 54"'}
          error={err.equipmentDescription}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="purchasePrice"
            label="Approximate price"
            inputMode="decimal"
            placeholder="$"
            defaultValue={suggestedPrice ? String(suggestedPrice) : undefined}
          />
          <TextField name="downPayment" label="Down payment" inputMode="decimal" placeholder="$" error={err.downPayment} />
        </div>
      </Section>

      <Section title="About you">
        <PersonFields prefix="applicant" err={err} />
      </Section>

      <div className="rounded-[var(--radius-plate)] border border-haze bg-white p-5 sm:p-7">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="hasCoApplicant"
            checked={coApplicant}
            onChange={(e) => setCoApplicant(e.target.checked)}
            className="mt-1 h-5 w-5 accent-[var(--color-ridge)]"
          />
          <span>
            <span className="font-semibold">Add a co-applicant</span>
            <span className="block text-sm text-steel">A spouse or partner applying with you.</span>
          </span>
        </label>
      </div>

      {coApplicant ? (
        <Section title="Co-applicant">
          <PersonFields prefix="coApplicant" err={err} />
        </Section>
      ) : null}

      <Section title="Review and submit">
        <p className="rounded-[var(--radius-plate)] bg-fescue p-4 text-sm leading-relaxed">{consentText}</p>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="consent"
            required
            aria-invalid={err.consent ? true : undefined}
            className="mt-1 h-5 w-5 accent-[var(--color-ridge)]"
          />
          <span className="font-semibold">I have read and agree to the statement above.</span>
        </label>
        {err.consent ? <p className="text-sm font-medium text-signal-deep">{err.consent}</p> : null}

        <SpamGuard siteKey={siteKey} renderedAt={renderedAt} state={state} />

        <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60 sm:w-auto">
          {pending ? 'Submitting securely…' : 'Submit application'}
        </button>
      </Section>
    </form>
  )
}
