/**
 * Starting content for the website's pages. `pnpm seed` creates any page that doesn't exist yet
 * (it never overwrites a page the dealer has edited). Model slugs are turned into IDs at seed time.
 */
type Slugged = { models?: string[] }
type DefaultBlock = { blockType: string; [key: string]: unknown } & Slugged

export type DefaultPage = {
  slug: string
  title: string
  intro?: string
  seo?: { title?: string; description?: string }
  layout: DefaultBlock[]
}

const SERVICES = {
  blockType: 'features',
  heading: 'After the sale, we’re right here',
  intro: 'Buy from a local dealer and you get set-up, warranty work and parts from people who know the machine.',
  background: 'panel',
  items: [
    {
      title: 'Financing',
      text: 'Apply online and our finance team will follow up with your options.',
      linkLabel: 'Apply for financing',
      linkUrl: '/financing',
    },
    {
      title: 'Service',
      text: 'Maintenance, repairs and warranty work on Bad Boy equipment at our shop.',
      linkLabel: 'Request service',
      linkUrl: '/service',
    },
    {
      title: 'Parts',
      text: 'Blades, belts, filters and other Bad Boy parts, shipped to your door.',
      linkLabel: 'Shop parts',
      linkUrl: '/parts',
    },
  ],
}

const FINANCE_BAND = {
  blockType: 'callToAction',
  heading: 'Financing available',
  text: 'Apply online in about ten minutes. Our finance team follows up with your options, usually the same day.',
  buttonLabel: 'Apply now',
  buttonUrl: '/financing',
  color: 'accent',
}

export const DEFAULT_PAGES: DefaultPage[] = [
  {
    slug: 'home',
    title: 'Home',
    layout: [
      {
        blockType: 'hero',
        eyebrow: 'Authorized Bad Boy dealer',
        heading: 'Bad Boy equipment for {region}',
        buttons: [
          { label: 'Shop equipment', url: '/equipment', style: 'primary' },
          { label: 'Apply for financing', url: '/financing', style: 'outline' },
        ],
      },
      { blockType: 'offers', heading: 'Current offers', limit: 3 },
      { blockType: 'categoryGrid', heading: 'The full Bad Boy line' },
      {
        blockType: 'acreage',
        heading: 'How much ground are you covering?',
        options: [
          {
            label: 'Under 1 acre',
            advice: 'In-town lots and smaller yards: a compact zero-turn or a walk mower is usually plenty.',
            models: ['mz-rambler', 'push-mower', 'e-series-self-propelled-mower'],
          },
          {
            label: '1–3 acres',
            advice: 'Most suburban and rural home lots land here. Residential zero-turns are the usual fit.',
            models: ['zt-elite', 'maverick', 'mz-magnum'],
          },
          {
            label: '3–10 acres',
            advice: 'Bigger properties and rough ground call for heavier decks, suspension or a small tractor.',
            models: ['rebel', 'maverick-hd', 'tractor-1025'],
          },
          {
            label: '10+ acres or a farm',
            advice: 'For pasture, fence lines and chores beyond mowing, look at commercial mowers, tractors and UTVs.',
            models: ['rogue', 'tractor-4035', 'bandit-750-crew-cab'],
          },
          {
            label: 'Commercial crew',
            advice: 'Built for daily hours: stand-ons for tight properties, big riders and walk-behinds for slopes.',
            models: ['revolt', 'renegade-diesel', 'raider'],
          },
        ],
      },
      { blockType: 'featuredModels', heading: 'Popular with our customers' },
      FINANCE_BAND,
      SERVICES,
      { blockType: 'visit', heading: 'Come see it in person' },
    ],
  },
  {
    slug: 'equipment',
    title: 'All Bad Boy equipment',
    intro: 'The complete Bad Boy lineup. Ask us about what’s on the lot today, or order any configuration.',
    layout: [],
  },
  {
    slug: 'inventory',
    title: 'In stock',
    intro: 'New and used equipment on our lot or on its way. Don’t see what you want? We can order any Bad Boy configuration.',
    layout: [FINANCE_BAND],
  },
  {
    slug: 'offers',
    title: 'Current offers',
    intro: 'Bad Boy financing programs, rebates and our own specials. Claim one and we’ll get back to you with the details.',
    layout: [],
  },
  {
    slug: 'compare',
    title: 'Compare equipment',
    intro: 'Line up to 4 Bad Boy models side by side. Rows where the models differ are highlighted.',
    layout: [],
  },
  {
    slug: 'contact',
    title: 'Contact us',
    intro: 'Questions about equipment, financing, parts or service? Send us a note or give us a call.',
    layout: [{ blockType: 'visit', heading: 'Visit the shop' }],
  },
  {
    slug: 'trade-in',
    title: 'Value your trade',
    intro: 'Tell us about the machine you’re trading in and we’ll get back to you with a value.',
    layout: [],
  },
  {
    slug: 'financing',
    title: 'Apply for financing',
    intro: 'Fill this out once and our finance team will work with our lenders to find you options. It takes about 10 minutes.',
    layout: [
      {
        blockType: 'faq',
        heading: 'Financing questions',
        items: [
          {
            question: 'How long does it take?',
            answer: 'The application takes about ten minutes. Our finance team usually follows up the same business day.',
          },
          {
            question: 'Is my information secure?',
            answer: 'Yes. Sensitive details are encrypted, and only our finance staff can see them.',
          },
          {
            question: 'Can I apply before I pick a machine?',
            answer: 'Yes. Apply now and we’ll help you choose equipment that fits the amount you’re approved for.',
          },
        ],
      },
    ],
  },
  {
    slug: 'parts',
    title: 'Parts and accessories',
    intro: 'Bad Boy accessories and parts, shipped by UPS. Can’t find a part number? Call our parts counter.',
    layout: [],
  },
  {
    slug: 'service',
    title: 'Service',
    intro: 'Maintenance, repairs and warranty work for Bad Boy equipment, by technicians who know these machines.',
    layout: [
      {
        blockType: 'features',
        background: 'panel',
        items: [
          { title: 'Seasonal maintenance', text: 'Oil, filters, belts, blade sharpening and a full inspection before the season starts.' },
          { title: 'Repairs', text: 'Engine, hydraulic, electrical and deck repairs on Bad Boy mowers, tractors and UTVs.' },
          { title: 'Warranty work', text: 'We handle Bad Boy warranty claims for machines bought here or elsewhere.' },
        ],
      },
      {
        blockType: 'leadForm',
        heading: 'Request service',
        intro: 'Tell us about your machine (model and serial number if you have it) and what it needs. We’ll call to schedule.',
        formType: 'contact',
      },
      { blockType: 'visit', heading: 'Bring it by' },
    ],
  },
]

/** Swaps model slugs in a default layout for the IDs in this database; unknown slugs are dropped. */
export function resolveDefaultLayout(layout: DefaultBlock[], modelIds: Map<string, number>) {
  const ids = (slugs?: unknown) =>
    Array.isArray(slugs) ? slugs.map((s) => modelIds.get(String(s))).filter((n): n is number => typeof n === 'number') : undefined
  return layout.map((block) => {
    if (block.blockType !== 'acreage') return 'models' in block ? { ...block, models: ids(block.models) } : block
    const options = (block.options as (Record<string, unknown> & Slugged)[]).map((o) => ({ ...o, models: ids(o.models) }))
    return { ...block, options }
  })
}
