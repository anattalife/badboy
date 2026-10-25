'use client'

import Link from 'next/link'
import { useState } from 'react'

export type AcreageOption = {
  id: string
  label: string
  advice: string
  picks: { name: string; href: string; note: string }[]
}

/**
 * Hero tool: pick how much ground you cover, get a short list of machines to look at.
 */
export function AcreageChooser({ options }: { options: AcreageOption[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const current = options.find((o) => o.id === selected)

  return (
    <div>
      <fieldset>
        <legend className="mb-3 text-lg font-semibold text-white">How much ground are you covering?</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const active = option.id === selected
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelected(active ? null : option.id)}
                className={`rounded-[var(--radius-plate)] border-2 px-4 py-2.5 font-semibold transition-colors [font-variation-settings:'wdth'_108] ${
                  active
                    ? 'border-signal bg-signal text-white'
                    : 'border-white/40 text-white hover:border-white hover:bg-white/10'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div aria-live="polite" className="mt-6 min-h-[9rem]">
        {current ? (
          <div className="animate-[rise_220ms_ease-out] rounded-[var(--radius-plate)] bg-paper p-5 text-ink shadow-xl">
            <p className="text-steel">{current.advice}</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {current.picks.map((pick) => (
                <li key={pick.href}>
                  <Link
                    href={pick.href}
                    className="block h-full rounded-md border border-haze p-3 hover:border-ridge hover:bg-fescue"
                  >
                    <span className="block font-bold text-ridge [font-variation-settings:'wdth'_112]">
                      {pick.name}
                    </span>
                    <span className="mt-1 block text-sm text-steel">{pick.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-haze">Pick a size and we’ll point you to the machines that fit.</p>
        )}
      </div>
      <style>{`@keyframes rise { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }`}</style>
    </div>
  )
}
