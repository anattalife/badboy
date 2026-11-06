import Link from 'next/link'

import { formatPrice } from '@/lib/format'
import { getSiteSettings } from '@/lib/payload'
import { priceView } from '@/lib/pricing'
import type { Inventory, Model } from '@/payload-types'

type Props = {
  /** A model shows “From $X” using its starting price; a unit shows its own price. */
  model?: Model
  unit?: Inventory
  quoteHref: string
  size?: 'sm' | 'md' | 'lg'
  /** Cards sit inside a full-card link, so the quote link is shown as text there. */
  inCard?: boolean
}

const modelMsrp = (m: Model) => {
  const configs = (m.configurations ?? []).map((c) => c.msrp).filter((n): n is number => typeof n === 'number' && n > 0)
  return m.msrp ?? (configs.length ? Math.min(...configs) : null)
}

export async function Price({ model, unit, quoteHref, size = 'md', inCard = false }: Props) {
  const settings = await getSiteSettings()
  const view = unit
    ? priceView(settings, { price: unit.price, msrp: unit.msrp, priceDisplay: unit.priceDisplay })
    : priceView(settings, { price: model?.startingPrice, msrp: model ? modelMsrp(model) : null, priceDisplay: model?.priceDisplay })

  const text = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' }[size]
  if (!view.amount) {
    return inCard ? (
      <p className={`font-semibold text-signal-deep ${size === 'sm' ? 'text-base' : 'text-lg'}`}>Get today’s price</p>
    ) : (
      <Link
        href={quoteHref}
        className={`font-bold text-signal-deep underline underline-offset-4 ${size === 'lg' ? 'text-2xl' : ''}`}
      >
        Get today’s price
      </Link>
    )
  }

  return (
    <div>
      <p className={`font-bold text-ridge [font-variation-settings:'wdth'_110] ${text}`}>
        {model && !unit && !view.label ? <span className="font-semibold">From </span> : null}
        {view.label ? <span className="mr-1 text-[0.7em] font-semibold text-steel">{view.label}</span> : null}
        {formatPrice(view.amount)}
        {view.strike ? (
          <span className="ml-2 text-[0.6em] font-normal text-steel line-through">
            <span className="sr-only">MSRP </span>
            {formatPrice(view.strike)}
          </span>
        ) : null}
      </p>
      {view.monthly ? (
        <p className="text-sm text-steel">
          or est. <strong className="text-ink">{formatPrice(view.monthly)}/mo</strong>
          <span aria-hidden="true">*</span>
          {inCard ? null : (
            <>
              {' · '}
              <Link href="/financing" className="font-semibold text-ridge underline">
                Apply
              </Link>
            </>
          )}
        </p>
      ) : null}
    </div>
  )
}

/** The fine print for payment estimates. Render once per page that shows estimates. */
export async function PaymentDisclaimer() {
  const settings = await getSiteSettings()
  if (!settings.showPaymentEstimate || !settings.financeDisclaimer) return null
  return (
    <p className="mx-auto max-w-7xl px-4 pt-10 text-xs text-steel sm:px-6">
      * {settings.financeDisclaimer} Estimate based on {settings.financeApr ?? 0}% APR for {settings.financeTermMonths}{' '}
      months{settings.financeDownPercent ? ` with ${settings.financeDownPercent}% down` : ''}.
    </p>
  )
}
