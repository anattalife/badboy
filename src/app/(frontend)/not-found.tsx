import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <h1 className="type-decal text-5xl text-ridge">We couldn’t find that page</h1>
      <p className="mt-4 max-w-xl text-lg text-steel">
        The link may be old, or the model may have been renamed. Start from the full lineup instead.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/equipment" className="btn btn-primary">
          Browse equipment
        </Link>
        <Link href="/" className="btn btn-quiet text-ridge">
          Go to the home page
        </Link>
      </div>
    </div>
  )
}
