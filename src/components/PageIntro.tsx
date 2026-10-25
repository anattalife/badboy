import Link from 'next/link'

export function Breadcrumbs({ trail }: { trail: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-steel">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((crumb, i) => (
          <li key={crumb.label} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden="true">/</span> : null}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-ink hover:underline">
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function PageIntro({
  title,
  lede,
  trail,
  children,
}: {
  title: string
  lede?: string | null
  trail?: { href?: string; label: string }[]
  children?: React.ReactNode
}) {
  return (
    <div className="border-b border-haze bg-fescue">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6">
        {trail ? <Breadcrumbs trail={trail} /> : null}
        <h1 className="type-decal mt-4 max-w-4xl text-4xl text-ridge sm:text-5xl">{title}</h1>
        {lede ? <p className="mt-4 max-w-2xl text-lg text-steel">{lede}</p> : null}
        {children}
      </div>
    </div>
  )
}
