import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { getPayloadClient } from '@/lib/payload'

/** Only paths on this site, never another domain. */
const safePath = (p: string | null) => (p && p.startsWith('/') && !p.startsWith('//') ? p : '/')

/**
 * Turns on preview (drafts) for signed-in staff, then opens the page. Used by the admin's Preview
 * and Live Preview. Visitors without an admin session get a 401.
 */
export async function GET(request: Request) {
  const path = safePath(new URL(request.url).searchParams.get('path'))
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return new Response('Sign in to the admin to preview drafts.', { status: 401 })
  ;(await draftMode()).enable()
  redirect(path)
}
