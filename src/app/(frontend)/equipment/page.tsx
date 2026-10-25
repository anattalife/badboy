import type { Metadata } from 'next'

import { ModelCard } from '@/components/ModelCard'
import { PageIntro } from '@/components/PageIntro'
import { categoryOf } from '@/lib/format'
import { getAllModels, getCategories } from '@/lib/payload'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'All Bad Boy equipment',
  description: 'Every Bad Boy mower, tractor, UTV, construction machine and tool we sell in Roanoke, VA.',
}

export default async function EquipmentPage() {
  const [categories, models] = await Promise.all([getCategories(), getAllModels()])

  return (
    <>
      <PageIntro
        title="All Bad Boy equipment"
        lede="The complete 2026 Bad Boy lineup. Ask us about what's on the lot today, or order any configuration."
        trail={[{ href: '/', label: 'Home' }, { label: 'Equipment' }]}
      >
        <nav aria-label="Categories" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.slug}`}
                  className="inline-block rounded-full border border-ridge/30 bg-paper px-3.5 py-1.5 text-sm font-medium text-ridge hover:border-ridge"
                >
                  {c.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageIntro>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {categories.map((category) => {
          const inCategory = models.filter((m) => categoryOf(m)?.id === category.id)
          if (!inCategory.length) return null
          return (
            <section key={category.id} id={category.slug} className="scroll-mt-6 pt-14" aria-labelledby={`h-${category.slug}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 id={`h-${category.slug}`} className="type-decal-md text-2xl text-ridge sm:text-3xl">
                  {category.name}
                </h2>
                <Link href={`/equipment/${category.slug}`} className="font-semibold text-ridge hover:underline">
                  {category.name} details
                </Link>
              </div>
              {category.description ? <p className="mt-2 max-w-2xl text-steel">{category.description}</p> : null}
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {inCategory.map((model) => (
                  <ModelCard key={model.id} model={model} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}
