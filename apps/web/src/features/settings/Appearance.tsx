import { useMemo, useState } from "react"
import { DesktopIcon, MoonIcon, SunnyIcon } from "tdesign-icons-react"

import { normalizeHex } from "../../lib/theme/colorScale"
import {
  useThemePreferences,
  type ThemeMode
} from "../preferences/themePreferencesContext"
import { DEFAULT_PRIMARY_COLOR } from "../preferences/ThemePreferencesProvider"
import { copyTextToClipboard } from "./clipboard"
import type { ToastMessage } from "./Toast"

const themeOptions = [
  { mode: "light", label: "浅色", icon: <SunnyIcon /> },
  { mode: "dark", label: "深色", icon: <MoonIcon /> },
  { mode: "system", label: "跟随系统", icon: <DesktopIcon /> }
] as const

export type AppearanceProps = {
  onCopyToast: (message: ToastMessage) => void
}

export function Appearance({ onCopyToast }: AppearanceProps) {
  const { themeMode, primaryColor, colorScale, setThemeMode, setPrimaryColor } =
    useThemePreferences()
  const [draftColor, setDraftColor] = useState<string>(primaryColor)
  const [colorError, setColorError] = useState("")
  const sourceIndex = useMemo(
    () => colorScale.indexOf(primaryColor),
    [colorScale, primaryColor]
  )
  const isDefaultPrimaryColor = primaryColor === DEFAULT_PRIMARY_COLOR

  function applyPrimaryColor(value: string) {
    try {
      const normalizedColor = normalizeHex(value)
      setPrimaryColor(normalizedColor)
      setDraftColor(normalizedColor)
      setColorError("")
    } catch {
      setColorError("请输入 #RGB 或 #RRGGBB")
    }
  }

  function handleColorTextSubmit() {
    applyPrimaryColor(draftColor)
  }

  async function handleCopyScaleColor(color: string) {
    if (await copyTextToClipboard(color)) {
      onCopyToast({ tone: "success", text: `已复制 ${color}` })
      return
    }

    onCopyToast({ tone: "error", text: "复制失败" })
  }

  function handleResetPrimaryColor() {
    applyPrimaryColor(DEFAULT_PRIMARY_COLOR)
  }

  return (
    <section
      id="settings-appearance"
      className="rounded-xl bg-surface p-5 sm:p-6">
      <h2 className="m-0 mb-5 text-[15px] font-semibold text-ink-strong">
        外观
      </h2>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {themeOptions.map((option) => {
          const active = themeMode === option.mode

          return (
            <button
              key={option.mode}
              type="button"
              aria-pressed={active}
              onClick={() => setThemeMode(option.mode as ThemeMode)}
              className="min-h-24 rounded-[10px] border border-line bg-surface px-4 text-center text-2xl text-ink-muted transition hover:border-line-strong hover:bg-surface-hover aria-pressed:border-brand aria-pressed:bg-brand-soft aria-pressed:text-brand">
              <span className="mx-auto mb-2 grid size-7 place-items-center">
                {option.icon}
              </span>
              <span className="block text-[13px] font-medium text-current">
                {option.label}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mb-2 text-[12.5px] text-ink-muted">自定义主色</div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <input
            type="color"
            aria-label="Primary color picker"
            value={primaryColor}
            onChange={(event) => applyPrimaryColor(event.target.value)}
            className="h-11 w-11 shrink-0 cursor-pointer rounded-[10px] border-2 border-line bg-transparent p-0"
          />
          <input
            aria-label="Primary color"
            value={draftColor}
            onBlur={handleColorTextSubmit}
            onChange={(event) => {
              setDraftColor(event.target.value)
              setColorError("")
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleColorTextSubmit()
            }}
            className="h-11 w-36 min-w-0 rounded-[10px] border border-line bg-surface px-3.5 text-sm text-ink-strong outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-line"
          />
        </div>
        <button
          type="button"
          aria-label="恢复默认品牌主色"
          disabled={isDefaultPrimaryColor}
          onClick={handleResetPrimaryColor}
          className="size-8 shrink-0 rounded-full border border-line shadow-sm transition hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-default disabled:opacity-60 disabled:hover:border-line"
          style={{ backgroundColor: DEFAULT_PRIMARY_COLOR }}>
          <span className="sr-only">恢复默认品牌主色</span>
        </button>
      </div>
      {colorError ? (
        <p className="-mt-3 mb-5 text-xs text-danger">{colorError}</p>
      ) : null}

      <div className="overflow-hidden rounded-md border border-line">
        <div className="grid grid-cols-10">
          {colorScale.map((color, index) => (
            <button
              key={`${color}-${index}`}
              type="button"
              aria-label={`复制色阶 ${index + 1} 的十六进制值 ${color}`}
              className="relative h-10 cursor-pointer border-0 p-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              onClick={() => void handleCopyScaleColor(color)}
              style={{ backgroundColor: color }}>
              {sourceIndex === index ? (
                <span className="absolute inset-x-0 bottom-0 mx-auto h-1 w-6 rounded-t-full bg-white/90 shadow-sm" />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
