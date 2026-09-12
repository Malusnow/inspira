import { UserButton } from "@clerk/react"
import type { NoteInspiration } from "@inspira/contracts"
import {
  lazy,
  Suspense,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode
} from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import {
  AddIcon,
  ChartIcon,
  MoonIcon,
  SettingIcon,
  SunnyIcon
} from "tdesign-icons-react"

import { SearchField } from "../components/SearchField"
import { useThemePreferences } from "../features/preferences/themePreferencesContext"

const InspirationOverlay = lazy(() =>
  import("../features/notes/InspirationOverlay").then((module) => ({
    default: module.InspirationOverlay
  }))
)

export interface AppShellOutletContext {
  openNoteOverlay: (note?: NoteInspiration) => void
  query: string
  setQuery: (query: string) => void
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
      className="grid size-12 place-items-center rounded-xl border-0 bg-transparent text-[22px] text-ink-muted transition hover:bg-surface-hover hover:text-brand-ink-hover aria-current:bg-brand-soft aria-current:text-brand-ink">
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
      className="grid size-12 place-items-center rounded-xl border-0 bg-transparent text-[22px] text-ink-muted no-underline transition hover:bg-surface-hover hover:text-brand-ink-hover aria-current:bg-brand-soft aria-current:text-brand-ink">
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
  const tabListRef = useRef<HTMLDivElement | null>(null)
  const tabRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0
  })
  const activeIndex = Math.max(
    contentTabs.findIndex((tab) => location.pathname.startsWith(tab.path)),
    0
  )

  useLayoutEffect(() => {
    const activeTabElement = tabRefs.current[activeIndex]

    if (!activeTabElement) {
      return
    }

    const activeTab = activeTabElement

    function syncIndicator() {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth
      })
    }

    syncIndicator()

    const resizeObserver = new ResizeObserver(syncIndicator)

    if (tabListRef.current) {
      resizeObserver.observe(tabListRef.current)
    }

    for (const tabElement of tabRefs.current) {
      if (tabElement) {
        resizeObserver.observe(tabElement)
      }
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [activeIndex])

  return (
    <div
      ref={tabListRef}
      className="relative flex h-14 items-start"
      style={{ gap: CONTENT_TAB_GAP }}>
      {contentTabs.map((tab, index) => (
        <NavLink
          key={tab.label}
          ref={(element) => {
            tabRefs.current[index] = element
          }}
          to={tab.path}
          title={tab.label}
          aria-label={tab.label}
          aria-current={index === activeIndex ? "page" : undefined}
          className="h-11 p-0 font-serif text-[30px] font-normal italic leading-11 tracking-normal text-ink-muted no-underline transition-colors hover:text-brand-ink-hover aria-current:text-ink-strong">
          {tab.label}
        </NavLink>
      ))}
      <span
        aria-hidden="true"
        className="absolute bottom-0 h-2 rounded-full bg-brand transition-[transform,width] duration-300 ease-out"
        style={{
          transform: `translate3d(${indicatorStyle.left}px, 0, 0)`,
          width: indicatorStyle.width
        }}
      />
    </div>
  )
}

export function AppShell() {
  const location = useLocation()
  const { resolvedThemeMode, toggleResolvedThemeMode } = useThemePreferences()
  const [isOverlayVisible, setOverlayVisible] = useState(false)
  const [overlayNote, setOverlayNote] = useState<NoteInspiration | undefined>()
  const [query, setQuery] = useState("")
  const isDarkTheme = resolvedThemeMode === "dark"
  const isAllPage = location.pathname.startsWith("/all")
  const isSettingsPage = location.pathname.startsWith("/settings")
  const isInsightsPage = location.pathname.startsWith("/insights")
  const isStandalonePage = isSettingsPage || isInsightsPage

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
          className="mt-16 origin-center -rotate-90 whitespace-nowrap font-serif text-[28px] font-medium italic tracking-normal text-ink-strong no-underline transition-colors hover:text-brand-ink-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4">
          Inspira
        </button>
        <div className="mt-auto flex flex-col gap-2.5">
          <RailLink
            icon={<ChartIcon />}
            label="Insights"
            to="/insights"
            active={isInsightsPage}
          />
          <RailAction
            icon={isDarkTheme ? <SunnyIcon /> : <MoonIcon />}
            label={
              isDarkTheme ? "Switch to light theme" : "Switch to dark theme"
            }
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

      <div className="lg:pl-16">
        {isStandalonePage ? null : (
          <nav
            aria-label="Content"
            className="flex h-[84px] items-start justify-end gap-7 bg-canvas px-5 pt-4 sm:px-8 lg:px-10">
            {isAllPage ? (
              <SearchField
                value={query}
                onChange={setQuery}
                className="mr-auto hidden h-12 w-full max-w-[600px] gap-3 self-center rounded-2xl bg-surface-hover px-[18px] text-sm lg:flex"
                iconClassName="size-[17px]"
                inputClassName="text-[15px] text-ink-strong"
              />
            ) : null}
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

        <div key={location.pathname} className="page-transition-clip">
          <div className="page-transition">
            <Outlet
              context={
                {
                  openNoteOverlay,
                  query,
                  setQuery
                } satisfies AppShellOutletContext
              }
            />
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
