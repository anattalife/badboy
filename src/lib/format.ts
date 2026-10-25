import type { Category, Media, Model, SiteSetting } from '@/payload-types'

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export const formatPrice = (value?: number | null) => (value ? usd.format(value) : null)

const usdCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
/** Prices with cents, for parts. */
export const formatMoney = (value?: number | null) => (value ? usdCents.format(value) : null)

export const telHref = (phone?: string | null) => `tel:+1${(phone ?? '').replace(/\D/g, '').slice(-10)}`

export const categoryOf = (model: Model): Category | null =>
  typeof model.category === 'object' ? model.category : null

export const modelHref = (model: Model) => {
  const category = categoryOf(model)
  return category?.slug ? `/equipment/${category.slug}/${model.slug}` : '/equipment'
}

export const firstImage = (model: Model): Media | null => {
  const image = model.images?.[0]
  return image && typeof image === 'object' ? image : null
}

export const fullAddress = (settings: SiteSetting) => {
  const a = settings.address
  return a ? `${a.street}, ${a.city}, ${a.state} ${a.zip}` : ''
}

/** Picks a placeholder illustration for a category slug. */
export type EquipmentKind =
  | 'zero-turn'
  | 'stand-on'
  | 'walk-behind'
  | 'push'
  | 'tractor'
  | 'implement'
  | 'utv'
  | 'loader'
  | 'tool'

export const kindForCategory = (slug?: string | null): EquipmentKind => {
  switch (slug) {
    case 'stand-on-mowers':
      return 'stand-on'
    case 'walk-behind-mowers':
      return 'walk-behind'
    case 'push-mowers':
      return 'push'
    case 'tractors':
      return 'tractor'
    case 'implements':
      return 'implement'
    case 'utvs':
      return 'utv'
    case 'light-construction':
      return 'loader'
    case 'e-series-tools':
    case 'gas-tools':
      return 'tool'
    default:
      return 'zero-turn'
  }
}
