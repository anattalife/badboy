import Image from 'next/image'
import Link from 'next/link'

import { categoryOf, firstImage, kindForCategory, modelHref } from '@/lib/format'
import type { Model } from '@/payload-types'

import { CompareToggle } from './CompareControls'
import { EquipmentArt } from './EquipmentArt'
import { Price } from './Price'

export function ModelCard({ model, showCategory = false }: { model: Model; showCategory?: boolean }) {
  const category = categoryOf(model)
  const image = firstImage(model)
  const deckSpec = model.specs?.find((s) => s.label === 'Cutting Widths')?.value
  const hpSpec = model.specs?.find((s) => s.label === 'Horsepower')?.value

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[var(--radius-plate)] border border-haze bg-white">
      {image?.url ? (
        <Image
          src={image.url}
          alt={image.alt}
          width={image.width ?? 960}
          height={image.height ?? 560}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="aspect-[12/7] w-full object-contain p-3"
        />
      ) : (
        <EquipmentArt kind={kindForCategory(category?.slug)} className="aspect-[12/7]" label={model.name} />
      )}
      <div className="flex flex-1 flex-col p-5">
        {showCategory && category ? <p className="text-sm text-steel">{category.name}</p> : null}
        <h3 className="type-decal-md text-xl text-ink">
          <Link href={modelHref(model)} className="after:absolute after:inset-0 focus-visible:outline-none">
            {model.name}
          </Link>
        </h3>
        {model.tagline ? <p className="mt-1.5 text-steel">{model.tagline}</p> : null}
        {deckSpec || hpSpec ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-fescue pt-4 text-sm">
            {deckSpec ? (
              <div>
                <dt className="text-steel">Deck</dt>
                <dd className="font-semibold">{deckSpec}</dd>
              </div>
            ) : null}
            {hpSpec ? (
              <div>
                <dt className="text-steel">Power</dt>
                <dd className="font-semibold">{hpSpec}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <Price model={model} quoteHref={`/contact?model=${encodeURIComponent(model.slug ?? '')}`} size="sm" inCard />
          {model.slug ? <CompareToggle slug={model.slug} name={model.name} /> : null}
        </div>
      </div>
    </article>
  )
}
