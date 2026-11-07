'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { usePathname, useRouter } from 'next/navigation'

/** Shown only in preview: refreshes as the editor saves drafts, with a way out. */
export function PreviewBar({ serverURL }: { serverURL: string }) {
  const router = useRouter()
  const path = usePathname()
  return (
    <>
      <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={serverURL} />
      <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-signal px-4 py-1.5 text-sm font-semibold text-white">
        Preview: you’re seeing unpublished changes.
        <a href={`/preview/exit?path=${encodeURIComponent(path)}`} className="underline">
          Exit preview
        </a>
      </div>
    </>
  )
}
