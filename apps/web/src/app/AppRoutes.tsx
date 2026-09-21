import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AppShell } from "./AppShell"
import { lazy, Suspense } from "react"
import { ThemePreferencesProvider } from "../features/preferences/ThemePreferencesProvider"
import {
  loadAllPage,
  loadInsightsPage,
  loadSettingsPage,
  loadWorkspacePage,
} from "./routeLoader"

const AllPage = lazy(() =>
  loadAllPage().then((module) => ({
    default: module.AllPage,
  })),
)

const WorkspacePage = lazy(() =>
  loadWorkspacePage().then((module) => ({
    default: module.WorkspacePage,
  })),
)

const InsightsPage = lazy(() =>
  loadInsightsPage().then((module) => ({
    default: module.InsightsPage,
  })),
)

const SettingsPage = lazy(() =>
  loadSettingsPage().then((module) => ({
    default: module.SettingsPage,
  })),
)

const basename = import.meta.env.BASE_URL.replace(/\/$/, "")

export function AppRoutes() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Navigate to="/all" replace />} />

        <Route
          element={
            <ThemePreferencesProvider>
              <AppShell />
            </ThemePreferencesProvider>
          }
        >
          <Route
            path="/all"
            element={
              <Suspense fallback={null}>
                <AllPage />
              </Suspense>
            }
          />

          <Route
            path="/workspace"
            element={
              <Suspense fallback={null}>
                <WorkspacePage />
              </Suspense>
            }
          />

          <Route
            path="/insights"
            element={
              <Suspense fallback={null}>
                <InsightsPage />
              </Suspense>
            }
          />

          <Route
            path="/settings"
            element={
              <Suspense fallback={null}>
                <SettingsPage />
              </Suspense>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/all" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
