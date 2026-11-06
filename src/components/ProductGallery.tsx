'use client'

import Image from 'next/image'
import { useState } from 'react'

export type GalleryImage = { id: number | string; url: string; alt: string; width?: number | null; height?: number | null }

/**
 * Main photo with a row of thumbnails. `contain` suits studio cut-outs (the whole machine shows);
 * `cover` suits photos taken on the lot.
 */
export function ProductGallery({ images, fit = 'contain' }: { images: GalleryImage[]; fit?: 'contain' | 'cover' }) {
  const [index, setIndex] = useState(0)
  const current = images[Math.min(index, images.length - 1)]
  if (!current) return null
  const fitClass = fit === 'contain' ? 'object-contain bg-white p-4 sm:p-6' : 'object-cover'

  return (
    <div>
      <Image
        key={current.id}
        src={current.url}
        alt={current.alt}
        width={current.width ?? 1200}
        height={current.height ?? 700}
        priority={index === 0}
        sizes="(min-width: 1024px) 55vw, 100vw"
        className={`aspect-[12/7] w-full rounded-[var(--radius-plate)] ${fitClass}`}
      />
      {images.length > 1 ? (
        <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8" aria-label="More photos">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}: ${img.alt}`}
                aria-current={i === index}
                className={`block w-full overflow-hidden rounded border-2 bg-white ${
                  i === index ? 'border-signal' : 'border-transparent hover:border-haze'
                }`}
              >
                <Image
                  src={img.url}
                  alt=""
                  width={160}
                  height={94}
                  sizes="120px"
                  className={`aspect-[12/7] w-full ${fit === 'contain' ? 'object-contain p-1' : 'object-cover'}`}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
