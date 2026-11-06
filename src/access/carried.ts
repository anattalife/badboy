import type { Access, Field, Payload, Where } from 'payload'

/**
 * "We don't sell this": dealers can hide whole categories (e.g. UTVs) or single models from the
 * public site. Hidden items stay in the admin so they can be switched back on.
 */
export const notCarriedField = (what: 'category' | 'model'): Field => ({
  name: 'notCarried',
  label: 'We don’t sell this',
  type: 'checkbox',
  defaultValue: false,
  index: true,
  admin: {
    position: 'sidebar',
    description:
      what === 'category'
        ? 'Hides this whole category and its models from the website. Switch off to show it again.'
        : 'Hides this model from the website. Switch off to show it again.',
  },
})

/** Matches documents that aren't hidden (`path` may point through a relationship). */
export const carried = (path = 'notCarried'): Where => ({
  or: [{ [path]: { equals: false } }, { [path]: { exists: false } }],
})

/**
 * A model shows when neither it nor its category is hidden. Hidden categories are looked up by ID
 * (there are only a handful), which keeps the query simple: filtering through the relationship
 * (`category.notCarried`) made Payload build a runaway join.
 */
export async function modelCarriedWhere(payload: Payload): Promise<Where> {
  const hidden = await payload.find({
    collection: 'categories',
    where: { notCarried: { equals: true } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
    select: {},
  })
  const ids = hidden.docs.map((c) => c.id)
  return ids.length ? { and: [carried(), { category: { not_in: ids } }] } : carried()
}

const signedIn = (req: { user?: unknown }) => Boolean(req.user)

export const categoryRead: Access = ({ req }) => (signedIn(req) ? true : carried())

/** Public: published and carried. Staff: everything, including drafts and hidden models. */
export const modelRead: Access = async ({ req }) =>
  signedIn(req) ? true : { and: [{ _status: { equals: 'published' } }, await modelCarriedWhere(req.payload)] }
