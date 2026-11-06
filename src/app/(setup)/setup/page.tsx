import Image from 'next/image'
import Link from 'next/link'

import { type CatalogCategory, SetupWizard } from '@/components/setup/SetupWizard'
import { getPayloadClient } from '@/lib/payload'
import { isSetupComplete, setupCodeRequired } from '@/lib/setup'

export default async function SetupPage() {
  const done = await isSetupComplete()
  const payload = await getPayloadClient()
  const catalog: CatalogCategory[] = []
  if (!done) {
    const [cats, models] = await Promise.all([
      payload.find({ collection: 'categories', sort: 'order', limit: 100, depth: 0, overrideAccess: true }),
      payload.find({ collection: 'models', sort: 'order', limit: 500, depth: 0, overrideAccess: true, draft: true }),
    ])
    for (const c of cats.docs) {
      catalog.push({
        id: c.id,
        name: c.name,
        models: models.docs.filter((m) => m.category === c.id).map((m) => ({ id: m.id, name: m.name })),
      })
    }
  }
  const codeMissing = setupCodeRequired() && (process.env.SETUP_CODE ?? '').length < 12

  return (
    <>
      <header className="bg-[#1d1d1b]">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-5 sm:px-6">
          <Image src="/brand/bbm_logo_horizontal_reverse.webp" alt="Bad Boy Mowers" width={150} height={34} className="h-8 w-auto" priority />
          <span className="text-sm text-white/70">Dealer website setup</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {done ? (
          <div className="rounded-[var(--radius-plate)] border border-haze bg-white p-8">
            <h1 className="type-decal-md text-2xl text-ridge">This website is already set up</h1>
            <p className="mt-3 text-steel">Change your dealership details in the admin under Settings → Dealership info.</p>
            <div className="mt-6 flex gap-3">
              <Link href="/admin" className="btn btn-primary">
                Go to the admin
              </Link>
              <Link href="/" className="btn btn-quiet text-ridge">
                View the website
              </Link>
            </div>
          </div>
        ) : codeMissing ? (
          <div className="rounded-[var(--radius-plate)] border border-haze bg-white p-8">
            <h1 className="type-decal-md text-2xl text-ridge">One step before setup</h1>
            <p className="mt-3">
              For security, set a <code>SETUP_CODE</code> secret on this website (at least 12 characters), then
              reload this page. In a terminal: <code>pnpm wrangler secret put SETUP_CODE</code>.
            </p>
          </div>
        ) : (
          <>
            <h1 className="type-decal text-3xl text-ridge sm:text-4xl">Welcome! Let’s set up your website</h1>
            <p className="mt-3 text-lg text-steel">
              Five short steps. The full Bad Boy line, photos, specs, compare, financing application and parts
              store are already built in.
            </p>
            <div className="mt-8">
              <SetupWizard codeRequired={setupCodeRequired()} catalog={catalog} />
            </div>
          </>
        )}
      </main>
    </>
  )
}
