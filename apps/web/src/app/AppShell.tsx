import { UserButton } from "@clerk/react"
import type { NoteInspiration } from "@inspira/contracts"
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import {
  AddIcon,
  ChartIcon,
  MoonIcon,
  SettingIcon,
  SunnyIcon
} from "tdesign-icons-react"

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

type ThemeMode = "light" | "dark"

const THEME_STORAGE_KEY = "inspira-theme-mode"

function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "light"
  }

  const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (storedMode === "light" || storedMode === "dark") {
    return storedMode
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

const contentTabs = [
  { label: "All", path: "/all", width: 46 },
  { label: "Workspace", path: "/workspace", width: 142 },
  { label: "Explore", path: "/explore", width: 104 }
] as const

const CONTENT_TAB_GAP = 38

function ContentTabs() {
  const location = useLocation()
  const activeIndex = Math.max(
    contentTabs.findIndex((tab) => location.pathname.startsWith(tab.path)),
    0
  )
  const underlineLeft = contentTabs
    .slice(0, activeIndex)
    .reduce((total, tab) => total + tab.width + CONTENT_TAB_GAP, 0)
  const activeTab = contentTabs[activeIndex]

  return (
    <div
      className="relative flex h-14 items-start"
      style={{ gap: CONTENT_TAB_GAP }}>
      {contentTabs.map((tab, index) => (
        <NavLink
          key={tab.label}
          to={tab.path}
          title={tab.label}
          aria-label={tab.label}
          aria-current={index === activeIndex ? "page" : undefined}
          className="h-11 p-0 font-serif text-[30px] font-normal italic leading-11 tracking-normal text-ink-muted no-underline transition-colors hover:text-brand aria-current:text-ink-strong"
          style={{ width: tab.width }}>
          {tab.label}
        </NavLink>
      ))}
      <span
        aria-hidden="true"
        className="absolute bottom-0 h-2 rounded-full bg-brand transition-[left,width] duration-300 ease-out"
        style={{
          left: underlineLeft,
          width: activeTab.width
        }}
      />
    </div>
  )
}

export function AppShell() {
  const location = useLocation()
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode)
  const [isOverlayVisible, setOverlayVisible] = useState(false)
  const [overlayNote, setOverlayNote] = useState<NoteInspiration | undefined>()
  const isDarkTheme = themeMode === "dark"

  useEffect(() => {
    const root = document.documentElement

    root.setAttribute("theme-mode", themeMode)
    root.dataset.theme = themeMode
    root.classList.toggle("dark", isDarkTheme)
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }, [isDarkTheme, themeMode])

  function openNoteOverlay(note?: NoteInspiration) {
    setOverlayNote(note)
    setOverlayVisible(true)
  }

  function closeNoteOverlay() {
    setOverlayVisible(false)
    setOverlayNote(undefined)
  }

  function toggleThemeMode() {
    setThemeMode((currentMode) =>
      currentMode === "dark" ? "light" : "dark"
    )
  }

  return (
    <main className="min-h-svh bg-canvas text-ink">
      <aside
        aria-label="Primary"
        className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col items-center border-r border-line bg-canvas px-2 py-7 lg:flex">
        <Link
          to="/all"
          title="All"
          aria-label="Inspira"
          className="mt-16 origin-center -rotate-90 whitespace-nowrap font-serif text-[28px] font-medium italic tracking-normal text-ink-strong no-underline transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4">
          Inspira
        </Link>
        <div className="mt-auto flex flex-col gap-2.5">
          <RailAction icon={<ChartIcon />} label="Insights" />
          <RailAction
            icon={isDarkTheme ? <SunnyIcon /> : <MoonIcon />}
            label={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
            pressed={isDarkTheme}
            onClick={toggleThemeMode}
          />
          <RailAction icon={<SettingIcon />} label="Settings" />
        </div>
      </aside>

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

      <div className="lg:pl-16">
        <div key={location.pathname} className="page-transition">
          <Outlet context={{ openNoteOverlay } satisfies AppShellOutletContext} />
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
