/**
 * UPS Rating API client (OAuth client credentials + Rating v2409 "Shop").
 * Spec: https://github.com/UPS-API/api-documentation (OAuthClientCredentials.yaml, Rating.yaml)
 *
 * Credentials come from Store settings → Shipping (an app at developer.ups.com with the Rating
 * product, plus the 6-character UPS account number); see src/lib/connections.ts.
 *
 * Without credentials outside production, sample rates are returned so the store can be demoed.
 */

export type Address = {
  name?: string
  street: string
  street2?: string
  city: string
  state: string
  zip: string
  residential?: boolean
}

export type Package = { weightLb: number; lengthIn?: number; widthIn?: number; heightIn?: number }

export type Rate = { code: string; amount: number; sample: boolean }

export class ShippingUnavailableError extends Error {}

export type UpsCredentials = {
  clientId: string
  clientSecret: string
  accountNumber: string
  live: boolean
}

const baseUrl = (c: UpsCredentials) =>
  c.live ? 'https://onlinetools.ups.com' : 'https://wwwcie.ups.com'

let tokenCache: { token: string; expiresAt: number; key: string } | null = null

/** Signs in to UPS; also used by the admin to check newly entered keys. */
export async function getToken(c: UpsCredentials): Promise<string> {
  const id = c.clientId
  const secret = c.clientSecret
  const key = `${baseUrl(c)}|${id}|${secret.slice(-6)}`
  if (tokenCache && tokenCache.key === key && tokenCache.expiresAt > Date.now() + 60_000)
    return tokenCache.token

  const res = await fetch(`${baseUrl(c)}/security/v1/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-merchant-id': c.accountNumber,
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) {
    throw new ShippingUnavailableError(
      res.status === 401 || res.status === 400
        ? 'UPS didn’t accept the Client ID and Client Secret.'
        : `UPS sign-in failed (${res.status}).`,
    )
  }
  const data = (await res.json()) as { access_token: string; expires_in: string | number }
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in) * 1000,
    key,
  }
  return data.access_token
}

const upsAddress = (a: Address) => ({
  AddressLine: [a.street, a.street2].filter(Boolean),
  City: a.city,
  StateProvinceCode: a.state,
  PostalCode: a.zip,
  CountryCode: 'US',
})

const fmt = (n: number) => (Math.ceil(n * 10) / 10).toFixed(1)

/** Builds the Rating API request body (exported for tests). */
export function buildRateRequest(
  from: Address & { phone?: string },
  to: Address,
  packages: Package[],
  accountNumber = '',
) {
  return {
    RateRequest: {
      Request: { TransactionReference: { CustomerContext: 'Parts order' } },
      Shipment: {
        Shipper: {
          Name: from.name ?? 'Shipper',
          ShipperNumber: accountNumber,
          Address: upsAddress(from),
        },
        ShipFrom: { Name: from.name ?? 'Shipper', Address: upsAddress(from) },
        ShipTo: {
          Name: to.name ?? 'Customer',
          Address: {
            ...upsAddress(to),
            ...(to.residential !== false ? { ResidentialAddressIndicator: '' } : {}),
          },
        },
        PaymentDetails: {
          ShipmentCharge: [{ Type: '01', BillShipper: { AccountNumber: accountNumber } }],
        },
        ShipmentRatingOptions: { NegotiatedRatesIndicator: '' },
        NumOfPieces: String(packages.length),
        Package: packages.map((p) => ({
          PackagingType: { Code: '02', Description: 'Package' },
          ...(p.lengthIn && p.widthIn && p.heightIn
            ? {
                Dimensions: {
                  UnitOfMeasurement: { Code: 'IN', Description: 'Inches' },
                  Length: fmt(p.lengthIn),
                  Width: fmt(p.widthIn),
                  Height: fmt(p.heightIn),
                },
              }
            : {}),
          PackageWeight: {
            UnitOfMeasurement: { Code: 'LBS', Description: 'Pounds' },
            Weight: fmt(Math.max(1, p.weightLb)),
          },
        })),
      },
    },
  }
}

type RatedShipment = {
  Service?: { Code?: string }
  TotalCharges?: { MonetaryValue?: string }
  NegotiatedRateCharges?: { TotalCharge?: { MonetaryValue?: string } }
}

/** Reads rates out of a Rating API response, preferring your negotiated (account) rates. */
export function parseRateResponse(json: unknown): { code: string; amount: number }[] {
  const shipments = (json as { RateResponse?: { RatedShipment?: RatedShipment | RatedShipment[] } })
    ?.RateResponse?.RatedShipment
  const list = Array.isArray(shipments) ? shipments : shipments ? [shipments] : []
  return list
    .map((s) => ({
      code: s.Service?.Code ?? '',
      amount: Number(
        s.NegotiatedRateCharges?.TotalCharge?.MonetaryValue ?? s.TotalCharges?.MonetaryValue,
      ),
    }))
    .filter((r) => r.code && Number.isFinite(r.amount))
}

/** Rough, clearly-labeled sample rates for demos when UPS isn't connected. */
export function sampleRates(
  packages: Package[],
  to: Address,
  from?: Address,
): { code: string; amount: number }[] {
  const weight = packages.reduce((s, p) => s + Math.max(1, p.weightLb), 0)
  // Rough distance: difference between the first digits of the two ZIP codes.
  const far = Math.abs(Number(to.zip.slice(0, 1)) - Number((from?.zip ?? '2').slice(0, 1)))
  const ground = 11 + weight * 0.9 + far * 2.5 + packages.length * 2
  const r = (n: number) => Math.round(n * 100) / 100
  return [
    { code: '03', amount: r(ground) },
    { code: '12', amount: r(ground * 1.9) },
    { code: '02', amount: r(ground * 2.6) },
    { code: '13', amount: r(ground * 3.6) },
    { code: '01', amount: r(ground * 4.2) },
  ]
}

export async function getUpsRates(
  creds: UpsCredentials | null,
  from: Address & { phone?: string },
  to: Address,
  packages: Package[],
): Promise<Rate[]> {
  if (!creds) {
    if (process.env.NODE_ENV === 'production') {
      throw new ShippingUnavailableError('UPS isn’t connected yet.')
    }
    return sampleRates(packages, to, from).map((r) => ({ ...r, sample: true }))
  }

  const token = await getToken(creds)
  const res = await fetch(`${baseUrl(creds)}/api/rating/v2409/Shop`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      transId: crypto.randomUUID().replace(/-/g, '').slice(0, 32),
      transactionSrc: 'baddealersite',
    },
    body: JSON.stringify(buildRateRequest(from, to, packages, creds.accountNumber)),
  })
  const json: unknown = await res.json().catch((): null => null)
  if (!res.ok) {
    const message =
      (json as { response?: { errors?: { message?: string }[] } })?.response?.errors?.[0]
        ?.message ?? `UPS couldn’t rate this shipment (${res.status}).`
    throw new ShippingUnavailableError(message)
  }
  return parseRateResponse(json).map((r) => ({ ...r, sample: false }))
}
