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

/** Minimal Lexical rich text (headings and paragraphs) for starting content. */
function richText(blocks: ([tag: 'h2' | 'p', text: string])[]) {
  const text = (t: string) => ({ type: 'text', text: t, format: 0, style: '', mode: 'normal', detail: 0, version: 1 })
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: blocks.map(([tag, t]) =>
        tag === 'h2'
          ? { type: 'heading', tag: 'h2', format: '', indent: 0, version: 1, direction: 'ltr', children: [text(t)] }
          : { type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, textStyle: '', children: [text(t)] },
      ),
    },
  }
}

const EDIT_ME = 'This is starting text. Edit it in the admin (Content → Pages) to match how your dealership works.'

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
  {
    slug: 'shipping-and-returns',
    title: 'Shipping and returns',
    intro: 'How online parts orders ship, and how to return a part.',
    layout: [
      {
        blockType: 'content',
        body: richText([
          ['p', EDIT_ME],
          ['h2', 'Shipping'],
          ['p', 'Parts ship by UPS to addresses in the United States. You choose the service and see the price at checkout. Orders placed by 2 pm on a business day usually leave the next business day.'],
          ['p', 'Large or heavy items that can’t ship by UPS are marked “Call to order”; call us and we’ll arrange freight or pickup.'],
          ['h2', 'Returns'],
          ['p', 'Unused parts in their original packaging can be returned within 30 days of delivery for a refund of the part price. Call us first so we can give you a return authorization. Return shipping is paid by the customer unless we sent the wrong part or it arrived damaged.'],
          ['p', 'Electrical parts that have been installed, special-order parts and clearance items can’t be returned.'],
          ['h2', 'Damaged or wrong parts'],
          ['p', 'If something arrives damaged or isn’t what you ordered, contact us within 7 days with your order number and a photo and we’ll make it right.'],
          ['h2', 'Refunds'],
          ['p', 'Refunds go back to the card you paid with, usually within 5 to 10 business days after we receive the return.'],
        ]),
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy',
    intro: 'What we collect on this website and how we use it.',
    layout: [
      {
        blockType: 'content',
        body: richText([
          ['p', EDIT_ME],
          ['h2', 'What we collect'],
          ['p', 'When you send a quote request, contact form, trade-in form, financing application or parts order, we keep what you enter so we can respond, process your application or ship your order.'],
          ['p', 'Card payments are handled by our payment processor on its own secure page. Your card number never reaches this website and we don’t store it.'],
          ['h2', 'Financing applications'],
          ['p', 'Sensitive details such as Social Security numbers, birth dates and income are encrypted. Only our finance staff can see them, and they’re shared only with lenders to find you financing.'],
          ['h2', 'What we don’t do'],
          ['p', 'We don’t sell your information. We use it to answer you, process your order or application, and keep our own records.'],
          ['h2', 'Questions'],
          ['p', 'Call or email us and we’ll tell you what we have on file or remove it where the law allows.'],
        ]),
      },
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
