import { afterEach, describe, expect, it } from 'vitest'

import { monthlyPayment, priceView } from '@/lib/pricing'

describe('price display', () => {
  const s = { priceDisplay: 'dealer' as const }

  it('shows the dealer price by default and never invents one', () => {
    expect(priceView(s, { price: 8499, msrp: 9299 })).toMatchObject({ amount: 8499, strike: null, label: null })
    expect(priceView(s, { price: null, msrp: 9299 }).amount).toBeNull()
  })

  it('supports MSRP, price-with-MSRP and hidden, with per-item overrides', () => {
    expect(priceView({ priceDisplay: 'msrp' }, { price: 8499, msrp: 9299 })).toMatchObject({ amount: 9299, label: 'MSRP' })
    expect(priceView({ priceDisplay: 'both' }, { price: 8499, msrp: 9299 })).toMatchObject({ amount: 8499, strike: 9299 })
    expect(priceView({ priceDisplay: 'both' }, { price: 9500, msrp: 9299 }).strike).toBeNull()
    expect(priceView({ priceDisplay: 'hidden' }, { price: 8499, msrp: 9299 }).amount).toBeNull()
    expect(priceView(s, { price: 8499, priceDisplay: 'hidden' }).amount).toBeNull()
    expect(priceView({ priceDisplay: 'hidden' }, { price: 8499, priceDisplay: 'default' }).amount).toBeNull()
  })

  it('estimates monthly payments only when turned on', () => {
    expect(monthlyPayment({ showPaymentEstimate: false, financeApr: 6.99, financeTermMonths: 60 }, 10000)).toBeNull()
    // $10,000 at 6.99% for 60 months is $197.96 → $198
    expect(monthlyPayment({ showPaymentEstimate: true, financeApr: 6.99, financeTermMonths: 60 }, 10000)).toBe(198)
    expect(monthlyPayment({ showPaymentEstimate: true, financeApr: 0, financeTermMonths: 48 }, 4800)).toBe(100)
    expect(monthlyPayment({ showPaymentEstimate: true, financeApr: 0, financeTermMonths: 48, financeDownPercent: 50 }, 4800)).toBe(50)
  })
})

describe('setup code', () => {
  const saved = { ...process.env }
  afterEach(() => {
    process.env = { ...saved }
  })

  it('is optional in demos and required, long and exact on the live site', async () => {
    const { setupCodeMatches } = await import('@/lib/setupCode')
    delete process.env.SETUP_CODE
    expect(setupCodeMatches('')).toBe(true)
    process.env.SETUP_CODE = 'short'
    expect(setupCodeMatches('short')).toBe(false)
    process.env.SETUP_CODE = 'a-long-enough-setup-code'
    expect(setupCodeMatches('a-long-enough-setup-code')).toBe(true)
    expect(setupCodeMatches('a-long-enough-setup-cod')).toBe(false)
    expect(setupCodeMatches('A-long-enough-setup-code')).toBe(false)
  })
})
