import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ChevronLeftIcon } from "tdesign-icons-react"

export interface StandalonePageProps {
  title: string
  subtitle: string
  children: ReactNode
}

/**
 * Shell shared by the pages that sit outside the content tabs (Settings,
 * Insights): a centered 980px column with a back link and a serif title.
 */
export function StandalonePage({
  title,
  subtitle,
  children
}: StandalonePageProps) {
  return (
    <section className="min-h-svh px-5 py-7 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-[980px]">
        <Link
          to="/all"
          className="mb-6 -ml-2 inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface-hover px-4 text-base font-medium text-ink-muted no-underline shadow-sm transition hover:border-brand-line hover:bg-brand-soft hover:text-brand-ink-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:-ml-4 lg:mb-10 lg:mt-6 lg:-ml-24">
          <ChevronLeftIcon className="size-4" />
          Back
        </Link>

        <header className="mb-9">
          <h1 className="m-0 font-serif text-[42px] font-normal italic leading-tight text-ink-strong">
            {title}
          </h1>
          <p className="m-0 mt-2 text-sm text-ink-muted">{subtitle}</p>
        </header>

        {children}
      </div>
    </section>
  )
}
