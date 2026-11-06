'use client'

import Link from 'next/link'
import { useState } from 'react'

export type BuildOption = { label: string; name: string; modelNumber?: string | null; engine?: string | null; horsepower?: string | null }

/** Pick a configuration and ask for a quote on exactly that build (sent with its Bad Boy model number). */
export function BuildQuote({ modelSlug, modelName, options }: { modelSlug: string; modelName: string; options: BuildOption[] }) {
  const [index, setIndex] = useState(0)
  const pick = options[index]
  if (!pick) return null
  return (
    <div className="rounded-[var(--radius-plate)] border border-haze bg-white p-5">
      <label htmlFor="build" className="font-bold text-ink [font-variation-settings:'wdth'_112]">
        Build your {modelName}
      </label>
      <select
        id="build"
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
        className="mt-2 block w-full rounded-[var(--radius-plate)] border border-steel-light bg-white px-3 py-2.5"
      >
        {options.map((o, i) => (
          <option key={o.label} value={i}>
            {o.name}
          </option>
        ))}
      </select>
      <p className="mt-2 text-sm text-steel">
        {[pick.engine, pick.horsepower, pick.modelNumber ? `Model ${pick.modelNumber}` : null].filter(Boolean).join(' · ')}
      </p>
      <Link
        href={`/contact?model=${encodeURIComponent(modelSlug)}&config=${encodeURIComponent(pick.label)}`}
        className="btn btn-primary mt-4 w-full justify-center"
      >
        Get a quote on this build
      </Link>
    </div>
  )
}
