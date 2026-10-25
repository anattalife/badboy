import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ModelCard } from '@/components/ModelCard'
import { PageIntro } from '@/components/PageIntro'
import { getCategoryBySlug, getModelsByCategory } from '@/lib/payload'

export async function generateMetadata(
  props: PageProps<'/equipment/[category]'>,
): Promise<Metadata> {
  const { category: slug } = await props.params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}
  return {
    title: `Bad Boy ${category.name}`,
    description: category.description ?? undefined,
  }
}

export default async function CategoryPage(props: PageProps<'/equipment/[category]'>) {
  const { category: slug } = await props.params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()
  const models = await getModelsByCategory(category.id)

  return (
    <>
      <PageIntro
        title={`Bad Boy ${category.name}`}
        lede={category.description}
        trail={[
          { href: '/', label: 'Home' },
          { href: '/equipment', label: 'Equipment' },
          { label: category.name },
        ]}
      />
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        {models.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        ) : (
          <p className="text-lg text-steel">
            No models are listed here yet. Call us and we’ll tell you what’s available.
          </p>
        )}
      </div>
    </>
  )
}
