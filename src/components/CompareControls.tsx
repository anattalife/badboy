'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSyncExternalStore } from 'react'

import { compareHref, MAX_COMPARE } from '@/lib/compare'

/*
 * The compare selection is a per-visitor convenience kept in localStorage.
 * The comparison itself lives in the URL, so it can be shared.
 */
const KEY = 'rm-compare'
const EVENT = 'rm-compare-change'
const EMPTY: string[] = []
let cachedRaw: string | null = null
let cachedValue: string[] = EMPTY

function read(): string[] {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(KEY)
  } catch {
    return EMPTY
  }
  if (raw === cachedRaw) return cachedValue
  cachedRaw = raw
  try {
    const parsed = JSON.parse(raw ?? '[]')
    cachedValue = Array.isArray(parsed)
      ? parsed.filter((s) => typeof s === 'string').slice(0, MAX_COMPARE)
      : EMPTY
  } catch {
    cachedValue = EMPTY
  }
  return cachedValue
}

function write(slugs: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(slugs))
  } catch {
    // Storage unavailable (private mode): selection just won't persist.
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

const useCompareList = () => useSyncExternalStore(subscribe, read, () => EMPTY)

export function CompareToggle({ slug, name }: { slug: string; name: string }) {
  const list = useCompareList()
  const selected = list.includes(slug)
  const full = !selected && list.length >= MAX_COMPARE

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={full}
      title={full ? `You can compare up to ${MAX_COMPARE} models` : undefined}
      onClick={() => write(selected ? list.filter((s) => s !== slug) : [...list, slug])}
      className={`relative z-10 inline-flex items-center gap-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
        selected ? 'text-field' : 'text-ridge hover:underline'
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex h-4 w-4 items-center justify-center rounded-sm border-2 ${
          selected ? 'border-field bg-field text-white' : 'border-ridge'
        }`}
      >
        {selected ? '✓' : ''}
      </span>
      <span>
        {selected ? 'Added to compare' : 'Compare'}
        <span className="sr-only"> {name}</span>
      </span>
    </button>
  )
}

/** Floating bar that appears once something is selected. */
export function CompareTray() {
  const list = useCompareList()
  const pathname = usePathname()
  if (!list.length || pathname === '/compare') return null

  return (
    <>
      {/* Spacer so the fixed bar never covers the end of the page. */}
      <div aria-hidden="true" className="h-20" />
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-haze bg-paper/95 shadow-[0_-4px_16px_rgba(27,38,48,0.12)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="text-sm">
            <strong>{list.length}</strong> of {MAX_COMPARE} models selected
            {list.length < 2 ? ' — pick at least one more' : ''}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => write([])}
              className="text-sm text-steel hover:underline"
            >
              Clear
            </button>
            <Link
              href={compareHref(list)}
              aria-disabled={list.length < 2}
              className={`btn btn-primary ${list.length < 2 ? 'pointer-events-none opacity-50' : ''}`}
            >
              Compare now
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

/** Keeps the stored selection in sync with what's on the compare page. */
export function CompareSync({ slugs }: { slugs: string[] }): null {
  const list = useCompareList()
  if (typeof window !== 'undefined' && list.join(',') !== slugs.join(',')) {
    // Deferred so it doesn't update other components during render.
    queueMicrotask(() => write(slugs))
  }
  return null
}
