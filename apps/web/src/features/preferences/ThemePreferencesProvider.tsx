import {
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react"

import { generateColorScale, normalizeHex, type HexColor } from "../../lib/theme/colorScale"
import { applyThemeVariables, buildThemeVariables, type ResolvedThemeMode } from "../../lib/theme/themeTokens"
import {
  ThemePreferencesContext,
  type DefaultViewPreference,
  type ThemeMode,
  type ThemePreferencesValue
} from "./themePreferencesContext"

export const DEFAULT_PRIMARY_COLOR = "#6c63ff" satisfies HexColor
const DEFAULT_THEME_MODE: ThemeMode = "light"
const DEFAULT_VIEW: DefaultViewPreference = "masonry"
const THEME_MODE_STORAGE_KEY = "inspira-theme-mode"
const PRIMARY_COLOR_STORAGE_KEY = "inspira-primary-color"
const DEFAULT_VIEW_STORAGE_KEY = "inspira-default-view"

function readStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_THEME_MODE

  const value = window.localStorage.getItem(THEME_MODE_STORAGE_KEY)

  return value === "light" || value === "dark" || value === "system" ? value : DEFAULT_THEME_MODE
}

function readStoredPrimaryColor(): HexColor {
  if (typeof window === "undefined") return DEFAULT_PRIMARY_COLOR

  try {
    const value = window.localStorage.getItem(PRIMARY_COLOR_STORAGE_KEY)
    return value ? normalizeHex(value) : DEFAULT_PRIMARY_COLOR
  } catch {
    return DEFAULT_PRIMARY_COLOR
  }
}

function readStoredDefaultView(): DefaultViewPreference {
  if (typeof window === "undefined") return DEFAULT_VIEW

  const value = window.localStorage.getItem(DEFAULT_VIEW_STORAGE_KEY)

  return value === "masonry" || value === "compact" ? value : DEFAULT_VIEW
}

function getSystemThemeMode(): ResolvedThemeMode {
  if (typeof window === "undefined") return "light"

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemePreferencesProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(readStoredThemeMode)
  const [systemThemeMode, setSystemThemeMode] = useState<ResolvedThemeMode>(getSystemThemeMode)
  const [primaryColor, updatePrimaryColor] = useState<HexColor>(readStoredPrimaryColor)
  const [defaultView, setDefaultView] = useState<DefaultViewPreference>(readStoredDefaultView)
  const resolvedThemeMode = themeMode === "system" ? systemThemeMode : themeMode
  const colorScale = useMemo(() => generateColorScale(primaryColor), [primaryColor])

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => setSystemThemeMode(media.matches ? "dark" : "light")

    handleChange()
    media.addEventListener("change", handleChange)

    return () => media.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const isDark = resolvedThemeMode === "dark"

    root.setAttribute("theme-mode", resolvedThemeMode)
    root.dataset.theme = resolvedThemeMode
    root.dataset.themePreference = themeMode
    root.classList.toggle("dark", isDark)
    applyThemeVariables(root, buildThemeVariables(primaryColor, colorScale, resolvedThemeMode))
  }, [colorScale, primaryColor, resolvedThemeMode, themeMode])

  useEffect(() => {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode)
  }, [themeMode])

  useEffect(() => {
    window.localStorage.setItem(PRIMARY_COLOR_STORAGE_KEY, primaryColor)
  }, [primaryColor])

  useEffect(() => {
    window.localStorage.setItem(DEFAULT_VIEW_STORAGE_KEY, defaultView)
  }, [defaultView])

  const value = useMemo<ThemePreferencesValue>(
    () => ({
      themeMode,
      resolvedThemeMode,
      primaryColor,
      colorScale,
      defaultView,
      setThemeMode,
      setPrimaryColor(color) {
        try {
          updatePrimaryColor(normalizeHex(color))
          return true
        } catch {
          return false
        }
      },
      setDefaultView,
      toggleResolvedThemeMode() {
        setThemeMode(resolvedThemeMode === "dark" ? "light" : "dark")
      }
    }),
    [colorScale, defaultView, primaryColor, resolvedThemeMode, themeMode]
  )

  return <ThemePreferencesContext.Provider value={value}>{children}</ThemePreferencesContext.Provider>
}
