import { createContext, useContext } from "react"

import type { ColorScale10, HexColor } from "../../lib/theme/colorScale"
import type { ResolvedThemeMode } from "../../lib/theme/themeTokens"

export type ThemeMode = "light" | "dark" | "system"
export type DefaultViewPreference = "masonry" | "compact"

export interface ThemePreferencesValue {
  themeMode: ThemeMode
  resolvedThemeMode: ResolvedThemeMode
  primaryColor: HexColor
  colorScale: ColorScale10
  defaultView: DefaultViewPreference
  setThemeMode: (mode: ThemeMode) => void
  setPrimaryColor: (color: string) => boolean
  setDefaultView: (view: DefaultViewPreference) => void
  toggleResolvedThemeMode: () => void
}

export const ThemePreferencesContext = createContext<ThemePreferencesValue | null>(null)

export function useThemePreferences() {
  const value = useContext(ThemePreferencesContext)

  if (!value) {
    throw new Error("useThemePreferences must be used inside ThemePreferencesProvider.")
  }

  return value
}
