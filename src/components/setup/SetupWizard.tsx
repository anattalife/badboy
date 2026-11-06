'use client'

import Image from 'next/image'
import Link from 'next/link'
import { startTransition, useActionState, useEffect, useRef, useState } from 'react'

import { completeSetup, verifySetupCode } from '@/app/(setup)/setup/actions'
import { FormMessage, TextField } from '@/components/forms/Fields'
import { idle } from '@/lib/forms'

const STEPS = ['Your dealership', 'Logo and look', 'Prices and financing', 'Your admin account'] as const

/** Which step each server-validated field lives on, so errors jump to the right place. */
const FIELD_STEP: Record<string, number> = {
  setupCode: 0, siteName: 0, legalName: 0, phone: 0, leadEmail: 0, street: 0, city: 0, state: 0, zip: 0, siteUrl: 0,
  logo: 1, brandColor: 1, accentColor: 1,
  priceDisplay: 2, financeApr: 2, financeTermMonths: 2, financeDownPercent: 2, taxRatePercent: 2,
  adminName: 3, adminEmail: 3, password: 3, passwordConfirm: 3,
}

const PRESETS = [
  { name: 'Bad Boy black', brand: '#1d1d1b', accent: '#e8641b' },
  { name: 'Slate', brand: '#2f4a5c', accent: '#e8641b' },
  { name: 'Forest', brand: '#2e4a33', accent: '#e8641b' },
  { name: 'Navy', brand: '#1f2f4f', accent: '#e8641b' },
]

const PRICE_CHOICES = [
  { value: 'dealer', title: 'Show our price', example: 'From $8,499' },
  { value: 'both', title: 'Our price with MSRP crossed out', example: 'From $8,499', strike: '$9,299' },
  { value: 'msrp', title: 'MSRP only', example: 'MSRP $9,299' },
  { value: 'hidden', title: 'Hide prices', example: '“Get today’s price” button (sends you a quote request)' },
]

const card = 'rounded-[var(--radius-plate)] border border-haze bg-white p-5 sm:p-8'

export function SetupWizard({ codeRequired, catalogLoaded }: { codeRequired: boolean; catalogLoaded: boolean }) {
  const [state, dispatch, pending] = useActionState(completeSetup, idle)
  const [step, setStep] = useState(0)
  const [checking, setChecking] = useState(false)
  const [codeError, setCodeError] = useState<string>()
  const [siteName, setSiteName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string>()
  const [brand, setBrand] = useState(PRESETS[0].brand)
  const [accent, setAccent] = useState(PRESETS[0].accent)
  const [estimate, setEstimate] = useState(false)
  const [tax, setTax] = useState(false)
  const fieldsets = useRef<(HTMLFieldSetElement | null)[]>([])
  const top = useRef<HTMLDivElement>(null)
  const err = state.status === 'error' ? (state.fieldErrors ?? {}) : {}

  // Server errors: go to the first step that has one (adjusting state during render, not in an effect).
  const [seen, setSeen] = useState(state)
  if (seen !== state) {
    setSeen(state)
    const steps = state.status === 'error' ? Object.keys(state.fieldErrors ?? {}).map((f) => FIELD_STEP[f] ?? 0) : []
    if (steps.length) setStep(Math.min(...steps))
  }

  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    top.current?.scrollIntoView({ block: 'start' })
  }, [step])
  useEffect(() => {
    return () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl)
    }
  }, [logoUrl])

  if (state.status === 'success') {
    return (
      <div className={card}>
        <h2 className="type-decal-md text-2xl text-ridge">You’re all set</h2>
        <p className="mt-3 text-lg">{state.message} Your website is live with the full Bad Boy line.</p>
        <ul className="mt-5 list-disc space-y-1 pl-5 text-steel">
          <li>Add your prices, in-stock units and parts in the admin.</li>
          <li>Post current Bad Boy offers under Content → Offers.</li>
          <li>Everything you entered here can be changed in Settings → Dealership info.</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin" className="btn btn-primary">
            Sign in to the admin
          </Link>
          <Link href="/" className="btn btn-quiet text-ridge">
            View your website
          </Link>
        </div>
      </div>
    )
  }

  function stepIsValid(i: number) {
    const set = fieldsets.current[i]
    const invalid = set
      ? Array.from(set.querySelectorAll<HTMLInputElement>('input,select,textarea')).find((el) => !el.checkValidity())
      : null
    invalid?.reportValidity()
    return !invalid
  }

  /** Browser checks for the current step, then the setup code on step 1. */
  async function next() {
    if (!stepIsValid(step)) return
    const set = fieldsets.current[step]
    if (step === 0 && codeRequired) {
      const code = set?.querySelector<HTMLInputElement>('input[name="setupCode"]')?.value ?? ''
      setChecking(true)
      const res = await verifySetupCode(code)
      setChecking(false)
      if (!res.ok) {
        setCodeError(res.message)
        return
      }
      setCodeError(undefined)
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  return (
    <div ref={top} className="scroll-mt-6">
      <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Setup steps">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? 'step' : undefined}>
            <div className={`h-1.5 rounded-full ${i <= step ? 'bg-signal' : 'bg-haze'}`} />
            <p className={`mt-2 hidden text-sm sm:block ${i === step ? 'font-semibold text-ink' : 'text-steel'}`}>
              {i + 1}. {label}
            </p>
          </li>
        ))}
      </ol>
      <p className="mb-4 text-sm text-steel sm:hidden">
        Step {step + 1} of {STEPS.length}: <strong className="text-ink">{STEPS[step]}</strong>
      </p>

      {!catalogLoaded ? (
        <p className="mb-5 rounded-[var(--radius-plate)] bg-fescue p-4 text-sm">
          The Bad Boy catalog hasn’t been loaded into this site yet. You can finish setup now; the models
          appear once the catalog is loaded (see docs/NEW-DEALER.md).
        </p>
      ) : null}

      <form
        // Submitted manually (not via `action`) so React doesn't clear the fields when validation fails.
        // Each step is checked on its own; hidden steps can't show the browser's error bubbles.
        onSubmit={(e) => {
          e.preventDefault()
          if (step < STEPS.length - 1) {
            void next()
            return
          }
          if (!stepIsValid(step)) return
          const data = new FormData(e.currentTarget)
          startTransition(() => dispatch(data))
        }}
        noValidate
        className={card}
      >
        {/* Step 1 */}
        <fieldset ref={(el) => {
          fieldsets.current[0] = el
        }} hidden={step !== 0} className="space-y-5">
          <legend className="type-decal-md mb-2 text-2xl text-ridge">Your dealership</legend>
          {codeRequired ? (
            <TextField
              name="setupCode"
              label="Setup code"
              required
              autoComplete="off"
              hint="The SETUP_CODE secret that was set when this website was deployed."
              error={codeError ?? err.setupCode}
            />
          ) : null}
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="siteName"
              label="Website name"
              required
              hint="Shown in the header and page titles, e.g. Smith Mowers"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              error={err.siteName}
            />
            <TextField name="legalName" label="Legal business name" required hint="e.g. Smith Farm Supply, LLC" error={err.legalName} />
            <TextField name="phone" label="Phone" type="tel" required autoComplete="tel" error={err.phone} />
            <TextField
              name="leadEmail"
              label="Email for new leads"
              type="email"
              required
              hint="Quote requests and credit applications are sent here. Not shown on the site."
              error={err.leadEmail}
            />
          </div>
          <TextField name="street" label="Street address" required autoComplete="address-line1" error={err.street} />
          <div className="grid gap-5 sm:grid-cols-[1fr_6rem_9rem]">
            <TextField name="city" label="City" required autoComplete="address-level2" error={err.city} />
            <TextField name="state" label="State" required maxLength={2} placeholder="VA" autoComplete="address-level1" error={err.state} />
            <TextField name="zip" label="ZIP" required inputMode="numeric" autoComplete="postal-code" error={err.zip} />
          </div>
          <TextField name="siteUrl" label="Website address" placeholder="www.yourdealership.com" error={err.siteUrl} />
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField name="hoursWeekdays" label="Hours Mon–Fri" defaultValue="8am–5pm" />
            <TextField name="hoursSaturday" label="Saturday" defaultValue="8am–12pm" />
            <TextField name="hoursSunday" label="Sunday" defaultValue="Closed" />
          </div>
        </fieldset>

        {/* Step 2 */}
        <fieldset ref={(el) => {
          fieldsets.current[1] = el
        }} hidden={step !== 1} className="space-y-6">
          <legend className="type-decal-md mb-2 text-2xl text-ridge">Logo and look</legend>
          <div>
            <label htmlFor="logo" className="text-sm font-medium text-ink">
              Your logo <span className="font-normal text-steel">(optional)</span>
            </label>
            <input
              id="logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="mt-1.5 block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-fescue file:px-4 file:py-2 file:font-semibold"
              onChange={(e) => {
                const f = e.target.files?.[0]
                setLogoUrl(f ? URL.createObjectURL(f) : undefined)
              }}
            />
            <p className="mt-1 text-xs text-steel">A wide PNG with a transparent background looks best. Without one, your website name is shown.</p>
            {err.logo ? <p className="mt-1 text-sm font-medium text-signal-deep">{err.logo}</p> : null}
          </div>

          <div>
            <p className="text-sm font-medium text-ink">Colors</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setBrand(p.brand)
                    setAccent(p.accent)
                  }}
                  aria-pressed={brand === p.brand && accent === p.accent}
                  className="flex items-center gap-2 rounded-full border border-haze px-3 py-1.5 text-sm aria-pressed:border-ink aria-pressed:font-semibold"
                >
                  <span className="h-4 w-4 rounded-full" style={{ background: p.brand }} />
                  {p.name}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input type="color" name="brandColor" value={brand} onChange={(e) => setBrand(e.target.value)} className="h-9 w-12" />
                Main color
              </label>
              <label className="flex items-center gap-2">
                <input type="color" name="accentColor" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-9 w-12" />
                Button color
              </label>
            </div>
          </div>

          <div aria-label="Preview" className="overflow-hidden rounded-[var(--radius-plate)] border border-haze">
            <div className="px-4 py-1.5 text-xs text-white" style={{ background: `color-mix(in srgb, ${brand} 68%, black)` }}>
              Preview
            </div>
            <div className="flex items-center justify-between gap-4 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local preview of an unsaved file
                  <img src={logoUrl} alt="" className="h-10 w-auto max-w-40 object-contain" />
                ) : (
                  <span className="type-decal text-lg" style={{ color: brand }}>
                    {siteName || 'Your Dealership'}
                  </span>
                )}
                <span className="h-8 w-px bg-haze" />
                <Image src="/brand/bbm_logo_horizontal.webp" alt="Bad Boy Mowers" width={110} height={25} className="h-6 w-auto" />
              </div>
              <span className="rounded px-3 py-1.5 text-sm font-semibold text-white" style={{ background: accent }}>
                Get a quote
              </span>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="regionName"
              label="Area you serve (short)"
              placeholder="the Shenandoah Valley"
              hint="Finishes the home headline “Bad Boy equipment for …”"
            />
            <TextField name="heroText" label="Home page intro" placeholder="Sold, financed and serviced right here in …" />
          </div>
        </fieldset>

        {/* Step 3 */}
        <fieldset ref={(el) => {
          fieldsets.current[2] = el
        }} hidden={step !== 2} className="space-y-6">
          <legend className="type-decal-md mb-2 text-2xl text-ridge">Prices and financing</legend>
          <div role="radiogroup" aria-label="How prices show" className="grid gap-3 sm:grid-cols-2">
            {PRICE_CHOICES.map((c, i) => (
              <label
                key={c.value}
                className="flex cursor-pointer gap-3 rounded-[var(--radius-plate)] border border-haze p-4 has-[:checked]:border-signal has-[:checked]:ring-2 has-[:checked]:ring-signal/25"
              >
                <input type="radio" name="priceDisplay" value={c.value} defaultChecked={i === 0} required className="mt-1 accent-[var(--color-signal)]" />
                <span>
                  <span className="block font-semibold">{c.title}</span>
                  <span className="block text-sm text-steel">
                    {c.example}
                    {'strike' in c ? <s className="ml-2">{c.strike}</s> : null}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-sm text-steel">You can change this any time, and set it differently for a single model or unit.</p>

          <div className="rounded-[var(--radius-plate)] bg-fescue p-4">
            <label className="flex items-center gap-3 font-semibold">
              <input type="checkbox" name="showPaymentEstimate" checked={estimate} onChange={(e) => setEstimate(e.target.checked)} className="h-5 w-5" />
              Show an estimated monthly payment next to prices
            </label>
            {estimate ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <TextField name="financeApr" label="APR (%)" type="number" step="0.01" min={0} max={40} defaultValue="6.99" required error={err.financeApr} />
                <TextField name="financeTermMonths" label="Term (months)" type="number" min={6} max={120} defaultValue="60" required error={err.financeTermMonths} />
                <TextField name="financeDownPercent" label="Down payment (%)" type="number" min={0} max={90} defaultValue="0" error={err.financeDownPercent} />
              </div>
            ) : null}
          </div>

          <div className="rounded-[var(--radius-plate)] bg-fescue p-4">
            <label className="flex items-center gap-3 font-semibold">
              <input type="checkbox" name="taxEnabled" checked={tax} onChange={(e) => setTax(e.target.checked)} className="h-5 w-5" />
              Charge sales tax on parts shipped to your state
            </label>
            {tax ? (
              <div className="mt-4 max-w-xs">
                <TextField name="taxRatePercent" label="Sales tax rate (%)" type="number" step="0.001" min={0} max={20} required error={err.taxRatePercent} hint="Confirm with your accountant." />
              </div>
            ) : null}
          </div>
        </fieldset>

        {/* Step 4 */}
        <fieldset ref={(el) => {
          fieldsets.current[3] = el
        }} hidden={step !== 3} className="space-y-5">
          <legend className="type-decal-md mb-2 text-2xl text-ridge">Your admin account</legend>
          <p className="text-steel">This is the main account for the website’s admin. You can add staff accounts later.</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="adminName" label="Your name" required autoComplete="name" error={err.adminName} />
            <TextField name="adminEmail" label="Your email" type="email" required autoComplete="email" error={err.adminEmail} />
            <TextField name="password" label="Password" type="password" required minLength={12} autoComplete="new-password" hint="At least 12 characters." error={err.password} />
            <TextField name="passwordConfirm" label="Password again" type="password" required minLength={12} autoComplete="new-password" error={err.passwordConfirm} />
          </div>
        </fieldset>

        {state.status === 'error' ? (
          <div className="mt-6">
            <FormMessage state={state} />
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-haze pt-6">
          {step > 0 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="btn btn-quiet text-ridge">
              Back
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className="btn btn-primary" disabled={pending || checking}>
            {step < STEPS.length - 1 ? (checking ? 'Checking…' : 'Next') : pending ? 'Setting up…' : 'Finish setup'}
          </button>
        </div>
      </form>
    </div>
  )
}
