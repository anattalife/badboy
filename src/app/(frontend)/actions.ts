'use server'

import { headers } from 'next/headers'

import { purgeExpiredApplications } from '@/collections/CreditApplications'
import { hasEncryptionKey } from '@/lib/crypto'
import { alertEmail } from '@/lib/email'
import {
  ageFrom,
  digits,
  type FieldErrors,
  formatSsn,
  type FormState,
  int,
  isEmail,
  isPhone,
  isSsn,
  isZip,
  money,
  str,
} from '@/lib/forms'
import { getPayloadClient } from '@/lib/payload'
import { checkSpam } from '@/lib/spam'

import { CONSENT_TEXT } from './financing/consent'

async function requestInfo() {
  const h = await headers()
  const ip = h.get('cf-connecting-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`
  return { ip, userAgent: h.get('user-agent')?.slice(0, 300) ?? null, siteUrl }
}

const SPAM_MESSAGE =
  'We couldn’t send your form. Please wait a few seconds and try again, or give us a call.'

async function findModelAndUnit(modelSlug: string, stockNumber: string) {
  const payload = await getPayloadClient()
  const [model, unit] = await Promise.all([
    modelSlug
      ? payload
          .find({ collection: 'models', where: { slug: { equals: modelSlug } }, limit: 1, depth: 0, overrideAccess: false })
          .then((r) => r.docs[0] ?? null)
      : null,
    stockNumber
      ? payload
          .find({ collection: 'inventory', where: { stockNumber: { equals: stockNumber } }, limit: 1, depth: 0, overrideAccess: false })
          .then((r) => r.docs[0] ?? null)
      : null,
  ])
  return { model, unit }
}

async function notify(subject: string, body: { text: string; html: string }, replyTo?: string) {
  const payload = await getPayloadClient()
  try {
    const settings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
    if (!settings.leadEmail) return
    await payload.sendEmail({ to: settings.leadEmail, subject, replyTo, ...body })
  } catch (error) {
    // The lead is already saved; a failed alert must not lose it or show an error to the customer.
    payload.logger.error({ err: error, msg: `Alert email failed: ${subject}` })
  }
}

/* ------------------------------------------------------------------ */
/* Quote, trade-in and contact                                         */
/* ------------------------------------------------------------------ */

export async function submitLead(_prev: FormState, form: FormData): Promise<FormState> {
  const { ip, siteUrl } = await requestInfo()
  const spam = await checkSpam(form, ip)
  if (!spam.ok) return { status: 'error', message: SPAM_MESSAGE }

  const type = str(form, 'type', 20)
  if (!['quote', 'trade-in', 'contact'].includes(type)) return { status: 'error', message: 'Unknown form.' }

  const name = str(form, 'name', 120)
  const email = str(form, 'email', 200)
  const phone = str(form, 'phone', 30)
  const preferredContact = str(form, 'preferredContact', 10)
  const message = str(form, 'message', 3000)
  const zip = str(form, 'zip', 10)
  const timeframe = str(form, 'timeframe', 20)

  const errors: FieldErrors = {}
  if (!name) errors.name = 'Enter your name.'
  if (!email && !phone) errors.phone = 'Enter a phone number or email so we can reach you.'
  if (email && !isEmail(email)) errors.email = 'Enter a valid email address.'
  if (phone && !isPhone(phone)) errors.phone = 'Enter a 10-digit phone number.'
  if (zip && !isZip(zip)) errors.zip = 'Enter a 5-digit ZIP code.'
  if (type === 'contact' && !message) errors.message = 'Tell us how we can help.'

  const tradeIn =
    type === 'trade-in'
      ? {
          year: int(str(form, 'tradeYear', 4), 2100),
          make: str(form, 'tradeMake', 60),
          model: str(form, 'tradeModel', 80),
          hours: int(str(form, 'tradeHours', 6), 100000),
          condition: str(form, 'tradeCondition', 20) || undefined,
          details: str(form, 'tradeDetails', 2000),
        }
      : undefined
  if (tradeIn) {
    if (!tradeIn.make) errors.tradeMake = 'Enter the make.'
    if (!tradeIn.model) errors.tradeModel = 'Enter the model.'
    if (!tradeIn.year || tradeIn.year < 1970) errors.tradeYear = 'Enter the year.'
  }

  if (Object.keys(errors).length) {
    return { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors: errors }
  }

  const { model, unit } = await findModelAndUnit(str(form, 'model', 80), str(form, 'unit', 40))
  const about = unit ? `${unit.title} (stock ${unit.stockNumber})` : model ? `Bad Boy ${model.name}` : null
  const tradeLabel = tradeIn ? `${tradeIn.year} ${tradeIn.make} ${tradeIn.model}` : null
  const typeLabel = { quote: 'Quote request', 'trade-in': 'Trade-in', contact: 'Contact' }[type]!
  const summary = [typeLabel, about ?? tradeLabel, name].filter(Boolean).join(' · ')

  const payload = await getPayloadClient()
  const lead = await payload.create({
    collection: 'leads',
    overrideAccess: true,
    data: {
      type: type as 'quote' | 'trade-in' | 'contact',
      status: 'new',
      summary,
      name,
      email: email || undefined,
      phone: phone || undefined,
      preferredContact: (['phone', 'text', 'email'].includes(preferredContact) ? preferredContact : undefined) as
        | 'phone'
        | 'text'
        | 'email'
        | undefined,
      zip: zip || undefined,
      timeframe: (['now', 'month', 'researching'].includes(timeframe) ? timeframe : undefined) as
        | 'now'
        | 'month'
        | 'researching'
        | undefined,
      message: message || undefined,
      model: model?.id,
      unit: unit?.id,
      tradeIn: tradeIn
        ? {
            ...tradeIn,
            year: tradeIn.year ?? undefined,
            hours: tradeIn.hours ?? undefined,
            condition: tradeIn.condition as 'excellent' | 'good' | 'fair' | 'needs-work' | undefined,
          }
        : undefined,
      source: { page: str(form, 'page', 300) || undefined, ip: ip ?? undefined },
    },
  })

  await notify(
    `New ${typeLabel.toLowerCase()}: ${about ?? tradeLabel ?? name}`,
    alertEmail(`New ${typeLabel.toLowerCase()} from the website`, [
      ['Name', name],
      ['Phone', phone],
      ['Email', email],
      ['Prefers', { phone: 'Phone call', text: 'Text message', email: 'Email' }[preferredContact]],
      ['Interested in', about],
      ['Timeframe', { now: 'Ready now', month: 'Within a month', researching: 'Just researching' }[timeframe]],
      ['ZIP', zip],
      ['Trade-in', tradeLabel],
      ['Trade-in hours', tradeIn?.hours],
      [
        'Trade-in condition',
        tradeIn?.condition
          ? { excellent: 'Excellent', good: 'Good', fair: 'Fair', 'needs-work': 'Needs work' }[tradeIn.condition]
          : undefined,
      ],
      ['Trade-in details', tradeIn?.details],
      ['Message', message],
    ], `${siteUrl}/admin/collections/leads/${lead.id}`),
    email || undefined,
  )

  const thanks = {
    quote: 'Thanks! We’ll get back to you with pricing soon.',
    'trade-in': 'Thanks! We’ll review your trade-in and get back to you with a value.',
    contact: 'Thanks for reaching out. We’ll get back to you soon.',
  }[type]!
  return { status: 'success', message: thanks }
}

/* ------------------------------------------------------------------ */
/* Credit application                                                  */
/* ------------------------------------------------------------------ */

function readPerson(form: FormData, prefix: string, errors: FieldErrors) {
  const f = (name: string, max = 120) => str(form, `${prefix}.${name}`, max)
  const e = (name: string, msg: string) => (errors[`${prefix}.${name}`] = msg)

  const person = {
    firstName: f('firstName', 60),
    middleInitial: f('middleInitial', 1),
    lastName: f('lastName', 60),
    email: f('email', 200),
    phone: f('phone', 30),
    ssn: f('ssn', 20),
    dateOfBirth: f('dateOfBirth', 10),
    street: f('street', 150),
    city: f('city', 80),
    state: f('state', 2).toUpperCase(),
    zip: f('zip', 10),
    yearsAtAddress: int(f('yearsAtAddress', 3)),
    monthsAtAddress: int(f('monthsAtAddress', 2), 11),
    housing: f('housing', 10),
    monthlyHousingPayment: money(f('monthlyHousingPayment', 12)),
    employmentStatus: f('employmentStatus', 20),
    employer: f('employer', 120),
    jobTitle: f('jobTitle', 80),
    employerPhone: f('employerPhone', 30),
    yearsEmployed: int(f('yearsEmployed', 3)),
    monthsEmployed: int(f('monthsEmployed', 2), 11),
    monthlyIncome: money(f('monthlyIncome', 12)),
    otherMonthlyIncome: money(f('otherMonthlyIncome', 12)),
    otherIncomeSource: f('otherIncomeSource', 120),
  }

  if (!person.firstName) e('firstName', 'Enter a first name.')
  if (!person.lastName) e('lastName', 'Enter a last name.')
  if (!isEmail(person.email)) e('email', 'Enter a valid email address.')
  if (!isPhone(person.phone)) e('phone', 'Enter a 10-digit phone number.')
  if (!isSsn(person.ssn)) e('ssn', 'Enter a valid 9-digit Social Security number.')
  const age = ageFrom(person.dateOfBirth)
  if (age === null) e('dateOfBirth', 'Enter a valid date of birth.')
  else if (age < 18) e('dateOfBirth', 'Applicants must be 18 or older.')
  else if (age > 120) e('dateOfBirth', 'Check the date of birth.')
  if (!person.street) e('street', 'Enter a street address.')
  if (!person.city) e('city', 'Enter a city.')
  if (!/^[A-Z]{2}$/.test(person.state)) e('state', 'Use the 2-letter state code.')
  if (!isZip(person.zip)) e('zip', 'Enter a 5-digit ZIP code.')
  if (person.yearsAtAddress === null) e('yearsAtAddress', 'Enter years at this address.')
  if (!['own', 'rent', 'family', 'other'].includes(person.housing)) e('housing', 'Choose one.')
  if (!['employed', 'self-employed', 'retired', 'other'].includes(person.employmentStatus))
    e('employmentStatus', 'Choose one.')
  if (['employed', 'self-employed'].includes(person.employmentStatus) && !person.employer)
    e('employer', 'Enter the employer or business name.')
  if (person.monthlyIncome === null) e('monthlyIncome', 'Enter gross monthly income.')
  if (person.employerPhone && !isPhone(person.employerPhone)) e('employerPhone', 'Enter a 10-digit phone number.')

  return person
}

type ReadPerson = ReturnType<typeof readPerson>

const toRecord = (p: ReadPerson) => ({
  firstName: p.firstName,
  middleInitial: p.middleInitial || undefined,
  lastName: p.lastName,
  email: p.email,
  phone: p.phone,
  ssn: formatSsn(p.ssn),
  dateOfBirth: p.dateOfBirth,
  address: {
    street: p.street,
    city: p.city,
    state: p.state,
    zip: p.zip,
    yearsAtAddress: p.yearsAtAddress ?? undefined,
    monthsAtAddress: p.monthsAtAddress ?? undefined,
    housing: p.housing as 'own' | 'rent' | 'family' | 'other',
    monthlyHousingPayment: p.monthlyHousingPayment ?? undefined,
  },
  employment: {
    status: p.employmentStatus as 'employed' | 'self-employed' | 'retired' | 'other',
    employer: p.employer || undefined,
    jobTitle: p.jobTitle || undefined,
    employerPhone: p.employerPhone || undefined,
    yearsEmployed: p.yearsEmployed ?? undefined,
    monthsEmployed: p.monthsEmployed ?? undefined,
  },
  // Stored as text so they can be encrypted.
  monthlyIncome: p.monthlyIncome != null ? String(p.monthlyIncome) : undefined,
  otherMonthlyIncome: p.otherMonthlyIncome != null ? String(p.otherMonthlyIncome) : undefined,
  otherIncomeSource: p.otherIncomeSource || undefined,
})

export async function submitCreditApplication(_prev: FormState, form: FormData): Promise<FormState> {
  const { ip, userAgent, siteUrl } = await requestInfo()
  const spam = await checkSpam(form, ip)
  if (!spam.ok) return { status: 'error', message: SPAM_MESSAGE }

  if (!hasEncryptionKey()) {
    // Never store applications unencrypted.
    return {
      status: 'error',
      message: 'Online applications are unavailable right now. Please call us to apply.',
    }
  }

  const errors: FieldErrors = {}
  const applicant = readPerson(form, 'applicant', errors)
  const hasCoApplicant = form.get('hasCoApplicant') === 'on'
  const coApplicant = hasCoApplicant ? readPerson(form, 'coApplicant', errors) : null

  const purchasePrice = money(str(form, 'purchasePrice', 12))
  const downPayment = money(str(form, 'downPayment', 12))
  const equipmentDescription = str(form, 'equipmentDescription', 200)
  const { model, unit } = await findModelAndUnit(str(form, 'model', 80), str(form, 'unit', 40))

  if (!model && !unit && !equipmentDescription)
    errors.equipmentDescription = 'Tell us what you’d like to finance.'
  if (downPayment != null && purchasePrice != null && downPayment > purchasePrice)
    errors.downPayment = 'Down payment can’t be more than the price.'
  if (form.get('consent') !== 'on') errors.consent = 'You must agree before we can process your application.'
  if (hasCoApplicant && coApplicant && digits(coApplicant.ssn) === digits(applicant.ssn))
    errors['coApplicant.ssn'] = 'The co-applicant’s SSN must be different from the applicant’s.'

  if (Object.keys(errors).length) {
    return { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors: errors }
  }

  const amountRequested =
    purchasePrice != null ? Math.max(0, purchasePrice - (downPayment ?? 0)) : undefined
  const about = unit ? `${unit.title} (stock ${unit.stockNumber})` : model ? `Bad Boy ${model.name}` : equipmentDescription
  const summary = `${applicant.firstName} ${applicant.lastName.slice(0, 1)}. · ${about}`

  const payload = await getPayloadClient()
  const app = await payload.create({
    collection: 'credit-applications',
    overrideAccess: true,
    context: { maskSensitive: true },
    data: {
      status: 'new',
      summary,
      model: model?.id,
      unit: unit?.id,
      equipmentDescription: equipmentDescription || undefined,
      purchasePrice: purchasePrice ?? undefined,
      downPayment: downPayment ?? undefined,
      amountRequested,
      applicant: toRecord(applicant),
      coApplicant: coApplicant ? [toRecord(coApplicant)] : [],
      consent: {
        agreedAt: new Date().toISOString(),
        text: CONSENT_TEXT,
        ip: ip ?? undefined,
        userAgent: userAgent ?? undefined,
      },
    },
  })

  // No sensitive data in email: just enough to know an application arrived.
  await notify(
    `New credit application #${app.id}`,
    alertEmail(
      'New credit application from the website',
      [
        ['Applicant', `${applicant.firstName} ${applicant.lastName.slice(0, 1)}.`],
        ['Co-applicant', hasCoApplicant ? 'Yes' : 'No'],
        ['Equipment', about],
        ['Note', 'Sign in to the admin to view the full application. Details are not sent by email.'],
      ],
      `${siteUrl}/admin/collections/credit-applications/${app.id}`,
    ),
  )

  await purgeExpiredApplications(payload).catch((error) =>
    payload.logger.error({ err: error, msg: 'Credit application cleanup failed' }),
  )

  return {
    status: 'success',
    message:
      'Thank you. Your application was received securely. Our finance team will contact you about next steps.',
  }
}
