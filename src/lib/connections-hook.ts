import { APIError, type GlobalBeforeChangeHook } from 'payload'

import { MASK_PREFIX } from '../fields/secret'
import { fromRaw } from './connections'
import { decrypt, isEncrypted } from './crypto'
import { checkKey, removeWebhook, setUpWebhook, StripeError } from './stripe'
import { getToken, ShippingUnavailableError } from './ups'

type Group = Record<string, unknown> | undefined

/** A value the dealer just typed (not the "Saved ••••1234" placeholder, not stored ciphertext). */
const typed = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() && !v.startsWith(MASK_PREFIX) && !isEncrypted(v)
    ? v.trim()
    : null
const cleared = (v: unknown) => v === '' || v === null
const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const today = () =>
  new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export const webhookUrl = () => {
  const site = (process.env.SITE_URL || '').replace(/\/$/, '')
  return site.startsWith('https://') ? `${site}/webhooks/stripe` : null
}

/**
 * Store settings hook: when the dealer changes the UPS or Stripe keys, check them with UPS/Stripe
 * before saving (a wrong key is refused with UPS's/Stripe's reason), and set up Stripe's payment
 * notifications (webhook) so the dealer never has to.
 */
export const checkConnections: GlobalBeforeChangeHook = async ({ data, req }) => {
  // Saves by staff who can't see the connection fields leave them alone.
  if (!data.ups && !data.stripe) return data
  const raw = (await req.payload.findGlobal({
    slug: 'store-settings',
    overrideAccess: true,
    depth: 0,
    context: { rawSecrets: true },
  })) as unknown as { ups?: Group; stripe?: Group }
  const stored = await fromRaw(raw as Parameters<typeof fromRaw>[0])

  // ---------------------------------------------------------------- UPS
  const ups = data.ups as Group
  if (ups) {
    const newSecret = typed(ups.clientSecret)
    const secret =
      newSecret ??
      (cleared(ups.clientSecret)
        ? null
        : raw.ups?.clientSecret
          ? await decrypt(String(raw.ups.clientSecret)).catch((): null => null)
          : null)
    const clientId = ups.clientId === undefined ? text(raw.ups?.clientId) : text(ups.clientId)
    const accountNumber =
      ups.accountNumber === undefined
        ? text(raw.ups?.accountNumber)
        : text(ups.accountNumber).toUpperCase()
    const testMode = ups.testMode === undefined ? Boolean(raw.ups?.testMode) : Boolean(ups.testMode)
    const changed =
      Boolean(newSecret) ||
      cleared(ups.clientSecret) ||
      clientId !== text(raw.ups?.clientId) ||
      accountNumber !== text(raw.ups?.accountNumber) ||
      testMode !== Boolean(raw.ups?.testMode)
    if (changed) {
      if (ups.accountNumber !== undefined) ups.accountNumber = accountNumber || null
      if (!clientId && !secret && !accountNumber) {
        ups.status = null
      } else if (!clientId || !secret || !accountNumber) {
        throw new APIError(
          'To connect UPS, fill in the Client ID, Client Secret and UPS account number.',
          400,
          null,
          true,
        )
      } else {
        try {
          await getToken({ clientId, clientSecret: secret, accountNumber, live: !testMode })
        } catch (e) {
          const reason =
            e instanceof ShippingUnavailableError ? e.message : 'UPS couldn’t be reached.'
          throw new APIError(
            `${reason} Check them at developer.ups.com and try again.`,
            400,
            null,
            true,
          )
        }
        ups.status = `Connected${testMode ? ' to UPS’s test system' : ''} · checked ${today()}`
      }
    }
  }

  // ---------------------------------------------------------------- Stripe
  const stripe = data.stripe as Group
  if (stripe) {
    const newKey = typed(stripe.secretKey)
    const url = webhookUrl()
    const oldKey = stored.stripe?.secretKey ?? null
    const oldHookId = text(raw.stripe?.webhookId) || null

    if (newKey) {
      let account: { name: string; live: boolean }
      try {
        account = await checkKey(newKey)
      } catch (e) {
        throw new APIError(
          e instanceof StripeError ? e.message : 'Stripe couldn’t be reached. Try again.',
          400,
          null,
          true,
        )
      }
      if (oldKey && oldHookId) await removeWebhook(oldKey, oldHookId)
      Object.assign(stripe, { webhookSecret: '', webhookId: null, webhookUrl: null })
      let note = ''
      if (url) {
        try {
          const hook = await setUpWebhook(newKey, url)
          Object.assign(stripe, { webhookSecret: hook.secret, webhookId: hook.id, webhookUrl: url })
        } catch (e) {
          // A restricted key may not manage webhooks; payments still confirm when the customer returns.
          note = ` Payment notifications couldn’t be set up (${e instanceof StripeError ? e.message : 'error'}); use a standard secret key.`
        }
      } else {
        note = ' Payment notifications start once the site runs at its https address.'
      }
      stripe.status = `Connected to ${account.name} · ${account.live ? 'LIVE: real payments' : 'TEST MODE: no real charges'} · checked ${today()}.${note}`
    } else if (cleared(stripe.secretKey)) {
      if (oldKey && oldHookId) await removeWebhook(oldKey, oldHookId)
      Object.assign(stripe, { webhookSecret: '', webhookId: null, webhookUrl: null, status: null })
    } else if (oldKey && url && text(raw.stripe?.webhookUrl) !== url) {
      // The site's address changed (e.g. moved to its own domain): point notifications at it.
      try {
        const hook = await setUpWebhook(oldKey, url, oldHookId)
        Object.assign(stripe, { webhookSecret: hook.secret, webhookId: hook.id, webhookUrl: url })
      } catch {
        // Leave the old settings; the next save tries again.
      }
    }
  }
  return data
}
