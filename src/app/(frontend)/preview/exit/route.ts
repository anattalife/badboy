import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams.get('path')
  ;(await draftMode()).disable()
  redirect(p && p.startsWith('/') && !p.startsWith('//') ? p : '/')
}
