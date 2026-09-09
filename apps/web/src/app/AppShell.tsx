import { UserButton } from "@clerk/react"
import type { NoteInspiration } from "@inspira/contracts"
import { lazy, Suspense, useState, type ReactNode } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import {
  AddIcon,
  ChartIcon,
  MoonIcon,
  SettingIcon,
  SunnyIcon
} from "tdesign-icons-react"

import { useThemePreferences } from "../features/preferences/themePreferencesContext"

const InspirationOverlay = lazy(() =>
  import("../features/notes/InspirationOverlay").then((module) => ({
    default: module.InspirationOverlay
  }))
)

export interface AppShellOutletContext {
  openNoteOverlay: (note?: NoteInspiration) => void
}

interface RailActionProps {
  icon: ReactNode
  label: string
  active?: boolean
  pressed?: boolean
  onClick?: () => void
}

interface RailLinkProps {
  icon: ReactNode
  label: string
  to: string
  active: boolean
}

function RailAction({
  icon,
  label,
  active = false,
  pressed,
  onClick
}: RailActionProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      aria-pressed={pressed}
      onClick={onClick}
      className="grid size-12 place-items-center rounded-xl border-0 bg-transparent text-[22px] text-ink-muted transition hover:bg-surface-hover hover:text-brand aria-current:bg-brand-soft aria-current:text-brand">
      {icon}
    </button>
  )
}

function RailLink({ icon, label, to, active }: RailLinkProps) {
  return (
    <NavLink
      to={to}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className="grid size-12 place-items-center rounded-xl border-0 bg-transparent text-[22px] text-ink-muted no-underline transition hover:bg-surface-hover hover:text-brand aria-current:bg-brand-soft aria-current:text-brand">
      {icon}
    </NavLink>
  )
}

const contentTabs = [
  { label: "All", path: "/all" },
  { label: "Workspace", path: "/workspace" },
  { label: "Explore", path: "/explore" }
] as const

const CONTENT_TAB_GAP = 38

function ContentTabs() {
  const location = useLocation()
  const activeIndex = Math.max(
    contentTabs.findIndex((tab) => location.pathname.startsWith(tab.path)),
    0
  )

  return (
    <div className="flex h-14 items-start" style={{ gap: CONTENT_TAB_GAP }}>
      {contentTabs.map((tab, index) => (
        <NavLink
          key={tab.label}
          to={tab.path}
          title={tab.label}
          aria-label={tab.label}
          aria-current={index === activeIndex ? "page" : undefined}
          className="relative h-11 p-0 font-serif text-[30px] font-normal italic leading-11 tracking-normal text-ink-muted no-underline transition-colors hover:text-brand aria-current:text-ink-strong">
          {tab.label}
          {index === activeIndex ? (
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-[-6px] h-2 rounded-full bg-brand"
            />
          ) : null}
        </NavLink>
      ))}
    </div>
  )
}

export function AppShell() {
  const location = useLocation()
  const { resolvedThemeMode, toggleResolvedThemeMode } = useThemePreferences()
  const [isOverlayVisible, setOverlayVisible] = useState(false)
  const [overlayNote, setOverlayNote] = useState<NoteInspiration | undefined>()
  const isDarkTheme = resolvedThemeMode === "dark"
  const isSettingsPage = location.pathname.startsWith("/settings")

  function openNoteOverlay(note?: NoteInspiration) {
    setOverlayNote(note)
    setOverlayVisible(true)
  }

  function closeNoteOverlay() {
    setOverlayVisible(false)
    setOverlayNote(undefined)
  }

  function scrollToPageTop() {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <main className="min-h-svh bg-canvas text-ink">
      <aside
        aria-label="Primary"
        className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col items-center border-r border-line bg-canvas px-2 py-7 lg:flex">
        <button
          type="button"
          title="Back to top"
          aria-label="Inspira"
          onClick={scrollToPageTop}
          className="mt-16 origin-center -rotate-90 whitespace-nowrap font-serif text-[28px] font-medium italic tracking-normal text-ink-strong no-underline transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4">
          Inspira
        </button>
        <div className="mt-auto flex flex-col gap-2.5">
          <RailAction icon={<ChartIcon />} label="Insights" />
          <RailAction
            icon={isDarkTheme ? <SunnyIcon /> : <MoonIcon />}
            label={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
            pressed={isDarkTheme}
            onClick={toggleResolvedThemeMode}
          />
          <RailLink
            icon={<SettingIcon />}
            label="Settings"
            to="/settings"
            active={isSettingsPage}
          />
        </div>
      </aside>

      {isSettingsPage ? null : (
        <nav
          aria-label="Content"
          className="fixed right-4 top-4 z-40 flex items-start gap-7 sm:right-8">
          <ContentTabs />
          <button
            type="button"
            title="New inspiration"
            aria-label="New inspiration"
            onClick={() => openNoteOverlay()}
            className="grid size-9.5 place-items-center rounded-full border-0 bg-brand text-canvas shadow-[0_2px_8px_rgb(108_99_255_/_0.25)] transition hover:scale-105 hover:bg-brand-hover">
            <AddIcon />
          </button>
          <span className="grid size-8.5 place-items-center rounded-full bg-surface-hover">
            <UserButton />
          </span>
        </nav>
      )}

      <div className="lg:pl-16">
        <div key={location.pathname} className="page-transition-clip">
          <div className="page-transition">
            <Outlet context={{ openNoteOverlay } satisfies AppShellOutletContext} />
          </div>
        </div>
      </div>

      {isOverlayVisible ? (
        <Suspense fallback={null}>
          <InspirationOverlay
            note={overlayNote}
            visible={isOverlayVisible}
            onDismiss={closeNoteOverlay}
          />
        </Suspense>
      ) : null}
    </main>
  )
}
