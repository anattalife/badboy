import type { Field } from 'payload'

export const PRICE_DISPLAY = [
  { label: 'Show our price', value: 'dealer' },
  { label: 'Show our price with MSRP crossed out', value: 'both' },
  { label: 'Show MSRP only', value: 'msrp' },
  { label: 'Hide prices (“Get today’s price” button)', value: 'hidden' },
] as const

export type PriceDisplay = (typeof PRICE_DISPLAY)[number]['value']

/** Per-item override of the dealer's default price display (Dealership info → Prices). */
export const priceDisplayOverride: Field = {
  name: 'priceDisplay',
  label: 'Price display',
  type: 'select',
  defaultValue: 'default',
  options: [{ label: 'Use the dealer default', value: 'default' }, ...PRICE_DISPLAY],
  admin: { description: 'Overrides the default set in Dealership info for this item only.' },
}
