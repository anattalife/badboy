'use server'

import { DEFAULT_ACCENT_COLOR, DEFAULT_BRAND_COLOR } from '@/globals/SiteSettings'
import type { PriceDisplay } from '@/fields/pricing'
import { type FieldErrors, type FormState, isEmail, isPhone, isZip, str } from '@/lib/forms'
import { getPayloadClient } from '@/lib/payload'
import { isSetupComplete, setupCodeMatches } from '@/lib/setup'

const HEX = /^#[0-9a-f]{6}$/i
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_LOGO_BYTES = 5 * 1024 * 1024
const PRICE_MODES: PriceDisplay[] = ['dealer', 'both', 'msrp', 'hidden']

const CLOSED: FormState = { status: 'error', message: 'This website is already set up. Sign in to the admin to make changes.' }
const BAD_CODE = 'That setup code isn’t right. It’s the SETUP_CODE secret set when the site was deployed.'

/** Step 1 check, so a wrong code is caught before the dealer fills in everything else. */
export async function verifySetupCode(code: string): Promise<{ ok: boolean; message?: string }> {
  if (await isSetupComplete()) return { ok: false, message: CLOSED.status === 'error' ? CLOSED.message : '' }
  return setupCodeMatches(String(code ?? '').slice(0, 200)) ? { ok: true } : { ok: false, message: BAD_CODE }
}

const num = (v: string, min: number, max: number) => {
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) && n >= min && n <= max ? n : NaN
}

export async function completeSetup(_prev: FormState, form: FormData): Promise<FormState> {
  if (await isSetupComplete()) return CLOSED
  if (!setupCodeMatches(str(form, 'setupCode', 200))) {
    return { status: 'error', message: BAD_CODE, fieldErrors: { setupCode: 'Check the setup code.' } }
  }

  const e: FieldErrors = {}
  const need = (name: string, label: string, max = 120) => {
    const v = str(form, name, max)
    if (!v) e[name] = `Enter ${label}.`
    return v
  }

  // Dealership
  const siteName = need('siteName', 'your website name')
  const legalName = need('legalName', 'your legal business name', 160)
  const phone = need('phone', 'your phone number', 30)
  if (phone && !isPhone(phone)) e.phone = 'Enter a 10-digit phone number.'
  const leadEmail = need('leadEmail', 'the email for new leads', 200)
  if (leadEmail && !isEmail(leadEmail)) e.leadEmail = 'Enter a valid email address.'
  const street = need('street', 'your street address')
  const city = need('city', 'your city', 80)
  const state = need('state', 'your state', 2).toUpperCase()
  if (state && !/^[A-Z]{2}$/.test(state)) e.state = 'Use the 2-letter state code.'
  const zip = need('zip', 'your ZIP code', 10)
  if (zip && !isZip(zip)) e.zip = 'Enter a 5-digit ZIP code.'
  let siteUrl = str(form, 'siteUrl', 200)
  if (siteUrl && !/^https?:\/\//i.test(siteUrl)) siteUrl = `https://${siteUrl}`
  if (siteUrl && !URL.canParse(siteUrl)) e.siteUrl = 'Enter a web address like www.yourdealership.com.'
  const hours = (
    [
      ['Mon–Fri', str(form, 'hoursWeekdays', 40)],
      ['Saturday', str(form, 'hoursSaturday', 40)],
      ['Sunday', str(form, 'hoursSunday', 40)],
    ] as const
  )
    .filter(([, h]) => h)
    .map(([days, h]) => ({ days, hours: h }))

  // Look
  const brandColor = str(form, 'brandColor', 7) || DEFAULT_BRAND_COLOR
  const accentColor = str(form, 'accentColor', 7) || DEFAULT_ACCENT_COLOR
  if (!HEX.test(brandColor)) e.brandColor = 'Pick a color.'
  if (!HEX.test(accentColor)) e.accentColor = 'Pick a color.'
  const regionName = str(form, 'regionName', 80)
  const heroText = str(form, 'heroText', 300)
  const logo = form.get('logo')
  const logoFile = logo instanceof File && logo.size > 0 ? logo : null
  if (logoFile && !LOGO_TYPES.includes(logoFile.type)) e.logo = 'Use a PNG, JPG or WebP image.'
  if (logoFile && logoFile.size > MAX_LOGO_BYTES) e.logo = 'Use an image under 5 MB.'

  // Prices, financing, tax
  const priceDisplay = str(form, 'priceDisplay', 10) as PriceDisplay
  if (!PRICE_MODES.includes(priceDisplay)) e.priceDisplay = 'Choose how prices show.'
  const financeApplication = str(form, 'financeApplication', 10) || 'builtin'
  if (!['builtin', 'links', 'both'].includes(financeApplication)) e.financeApplication = 'Choose a financing application.'
  const financeLinks: { label: string; url: string }[] = []
  if (financeApplication !== 'builtin') {
    for (let i = 0; i < 3; i++) {
      const label = str(form, `financeLinkLabel${i}`, 60)
      const url = str(form, `financeLinkUrl${i}`, 500)
      if (!url && !(i === 0)) continue
      if (!/^https:\/\/\S+$/i.test(url) || !URL.canParse(url)) {
        e[`financeLinkUrl${i}`] = 'Paste the full link, starting with https://'
        continue
      }
      if (!label) {
        e[`financeLinkLabel${i}`] = 'Enter the button text.'
        continue
      }
      financeLinks.push({ label, url })
    }
  }
  const showPaymentEstimate = form.get('showPaymentEstimate') === 'on'
  const financeApr = num(str(form, 'financeApr', 8), 0, 40)
  const financeTermMonths = num(str(form, 'financeTermMonths', 4), 6, 120)
  const financeDownPercent = num(str(form, 'financeDownPercent', 4), 0, 90)
  if (showPaymentEstimate) {
    if (financeApr === null || Number.isNaN(financeApr)) e.financeApr = 'Enter an APR between 0 and 40.'
    if (financeTermMonths === null || Number.isNaN(financeTermMonths)) e.financeTermMonths = 'Enter 6 to 120 months.'
    if (Number.isNaN(financeDownPercent)) e.financeDownPercent = 'Enter 0 to 90.'
  }
  const taxEnabled = form.get('taxEnabled') === 'on'
  const taxRatePercent = num(str(form, 'taxRatePercent', 6), 0, 20)
  if (taxEnabled && (taxRatePercent === null || Number.isNaN(taxRatePercent))) e.taxRatePercent = 'Enter a rate between 0 and 20.'

  // What they sell (only checked when the catalog is loaded)
  const ids = (name: string) =>
    form
      .getAll(name)
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n > 0)
      .slice(0, 1000)
  const carryCategories = new Set(ids('carryCategory'))
  const carryModels = new Set(ids('carryModel'))
  if (form.get('catalogShown') === '1' && carryCategories.size === 0) e.carry = 'Pick at least one kind of equipment you sell.'

  // Admin account
  const adminName = need('adminName', 'your name')
  const adminEmail = need('adminEmail', 'your email', 200).toLowerCase()
  if (adminEmail && !isEmail(adminEmail)) e.adminEmail = 'Enter a valid email address.'
  const password = String(form.get('password') ?? '')
  if (password.length < 12) e.password = 'Use at least 12 characters.'
  else if (password.length > 200) e.password = 'Use 200 characters or fewer.'
  if (password !== String(form.get('passwordConfirm') ?? '')) e.passwordConfirm = 'The passwords don’t match.'

  if (Object.keys(e).length) return { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors: e }

  const payload = await getPayloadClient()
  // Someone else may have finished setup while this form was open.
  if ((await payload.count({ collection: 'users', overrideAccess: true })).totalDocs > 0) return CLOSED

  let userId: number | undefined
  try {
    const user = await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { name: adminName, email: adminEmail, password, roles: ['admin'] },
    })
    userId = user.id

    let logoId: number | undefined
    if (logoFile) {
      const media = await payload.create({
        collection: 'media',
        overrideAccess: true,
        data: { alt: `${siteName} logo` },
        file: {
          data: Buffer.from(await logoFile.arrayBuffer()),
          mimetype: logoFile.type,
          name: logoFile.name.replace(/[^\w.-]+/g, '-').slice(-80) || 'logo.png',
          size: logoFile.size,
        },
      })
      logoId = media.id
    }

    // Hide what they don't sell. Models in a hidden category are hidden with it, so only models in
    // categories they kept are looked at one by one.
    const [cats, models] = await Promise.all([
      payload.find({ collection: 'categories', limit: 100, depth: 0, overrideAccess: true }),
      payload.find({ collection: 'models', limit: 500, depth: 0, overrideAccess: true, draft: true }),
    ])
    if (cats.docs.length) {
      for (const c of cats.docs) {
        const notCarried = !carryCategories.has(c.id)
        if (Boolean(c.notCarried) !== notCarried) {
          await payload.update({ collection: 'categories', id: c.id, data: { notCarried }, overrideAccess: true })
        }
      }
      for (const m of models.docs) {
        if (!carryCategories.has(m.category as number)) continue
        const notCarried = !carryModels.has(m.id)
        if (Boolean(m.notCarried) !== notCarried) {
          await payload.update({ collection: 'models', id: m.id, data: { notCarried }, overrideAccess: true })
        }
      }
    }

    await payload.updateGlobal({
      slug: 'store-settings',
      overrideAccess: true,
      data: {
        taxEnabled,
        taxState: taxEnabled ? state : null,
        taxRatePercent: taxEnabled ? taxRatePercent : null,
      },
    })

    await payload.updateGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      data: {
        siteName,
        legalName,
        siteUrl: siteUrl || null,
        phone,
        leadEmail,
        address: { street, city, state, zip },
        hours,
        logo: logoId ?? null,
        brandColor,
        accentColor,
        regionName: regionName || null,
        heroText: heroText || null,
        priceDisplay,
        financeApplication: financeApplication as 'builtin' | 'links' | 'both',
        financeLinks,
        showPaymentEstimate,
        financeApr: financeApr ?? undefined,
        financeTermMonths: financeTermMonths ?? undefined,
        financeDownPercent: financeDownPercent ?? 0,
        setupCompletedAt: new Date().toISOString(),
      },
    })
  } catch (err) {
    payload.logger.error({ err, msg: 'Setup wizard failed' })
    // Undo the account so the wizard can be run again.
    if (userId) await payload.delete({ collection: 'users', id: userId, overrideAccess: true }).catch(() => {})
    return { status: 'error', message: 'Something went wrong saving your setup. Please try again.' }
  }

  return { status: 'success', message: `${siteName} is ready.` }
}
