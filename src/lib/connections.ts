/**
 * The dealer's UPS and Stripe connections, from Store settings, decrypted for server code.
 * Nothing here may reach the browser. Not marked 'server-only' because the Payload config (CLI)
 * imports it through the settings hook; never import it from a client component.
 */
import type { Payload } from 'payload'

import { decrypt } from './crypto'
import { isLiveKey } from './stripe'
import type { UpsCredentials } from './ups'

export type { UpsCredentials }

export type StripeConnection = { secretKey: string; webhookSecret: string | null; live: boolean }

type RawSettings = {
  ups?: {
    clientId?: string | null
    clientSecret?: string | null
    accountNumber?: string | null
    testMode?: boolean | null
  }
  stripe?: { secretKey?: string | null; webhookSecret?: string | null }
}

const open = async (v?: string | null) => (v ? decrypt(v).catch((): null => null) : null)

export async function readConnections(
  payload: Payload,
): Promise<{ ups: UpsCredentials | null; stripe: StripeConnection | null }> {
  const raw = (await payload.findGlobal({
    slug: 'store-settings',
    overrideAccess: true,
    depth: 0,
    context: { rawSecrets: true },
  })) as unknown as RawSettings
  return fromRaw(raw)
}

export async function fromRaw(raw: RawSettings) {
  const [upsSecret, stripeKey, webhookSecret] = await Promise.all([
    open(raw.ups?.clientSecret),
    open(raw.stripe?.secretKey),
    open(raw.stripe?.webhookSecret),
  ])
  let ups: UpsCredentials | null =
    raw.ups?.clientId && upsSecret && raw.ups?.accountNumber
      ? {
          clientId: raw.ups.clientId.trim(),
          clientSecret: upsSecret,
          accountNumber: raw.ups.accountNumber.trim(),
          live: !raw.ups.testMode,
        }
      : null
  // Older installs set UPS keys as Worker secrets; still honoured when the admin fields are empty.
  if (
    !ups &&
    process.env.UPS_CLIENT_ID &&
    process.env.UPS_CLIENT_SECRET &&
    process.env.UPS_ACCOUNT_NUMBER
  ) {
    ups = {
      clientId: process.env.UPS_CLIENT_ID,
      clientSecret: process.env.UPS_CLIENT_SECRET,
      accountNumber: process.env.UPS_ACCOUNT_NUMBER,
      live: (process.env.UPS_ENV ?? 'production') === 'production',
    }
  }
  const stripe: StripeConnection | null = stripeKey
    ? { secretKey: stripeKey, webhookSecret, live: isLiveKey(stripeKey) }
    : null
  return { ups, stripe }
}
