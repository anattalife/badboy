import type { PriceDisplay } from '@/fields/pricing'

export type PriceSettings = {
  priceDisplay?: PriceDisplay | null
  showPaymentEstimate?: boolean | null
  financeApr?: number | null
  financeTermMonths?: number | null
  financeDownPercent?: number | null
}

export type PriceView = {
  /** The amount to show, or null for “Get today’s price”. */
  amount: number | null
  /** MSRP to show crossed out next to the amount. */
  strike: number | null
  /** “MSRP” when the amount shown is MSRP. */
  label: 'MSRP' | null
  /** Estimated monthly payment, when the dealer shows estimates. */
  monthly: number | null
}

const positive = (n?: number | null) => (typeof n === 'number' && n > 0 ? n : null)

/**
 * Decides what price to show for a model or unit, from the dealer's default and the item's own
 * override. Never invents a price: missing values fall through to “Get today’s price”.
 */
export function priceView(
  settings: PriceSettings,
  item: { price?: number | null; msrp?: number | null; priceDisplay?: string | null },
): PriceView {
  const mode =
    (item.priceDisplay && item.priceDisplay !== 'default'
      ? item.priceDisplay
      : settings.priceDisplay) ?? 'dealer'
  const price = positive(item.price)
  const msrp = positive(item.msrp)

  let amount: number | null = null
  let strike: number | null = null
  let label: PriceView['label'] = null
  if (mode === 'dealer') amount = price
  else if (mode === 'msrp') {
    amount = msrp
    label = msrp ? 'MSRP' : null
  } else if (mode === 'both') {
    amount = price ?? msrp
    label = !price && msrp ? 'MSRP' : null
    strike = price && msrp && msrp > price ? msrp : null
  }

  return { amount, strike, label, monthly: amount ? monthlyPayment(settings, amount) : null }
}

/** Standard amortized payment, rounded up to the dollar. Null unless the dealer shows estimates. */
export function monthlyPayment(settings: PriceSettings, amount: number): number | null {
  if (!settings.showPaymentEstimate) return null
  const months = Math.round(settings.financeTermMonths ?? 0)
  if (months < 1) return null
  const financed = amount * (1 - Math.min(Math.max(settings.financeDownPercent ?? 0, 0), 90) / 100)
  const r = Math.max(settings.financeApr ?? 0, 0) / 100 / 12
  const payment = r === 0 ? financed / months : (financed * r) / (1 - (1 + r) ** -months)
  return Math.ceil(payment)
}
