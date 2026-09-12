import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AllPage } from "../features/all/AllPage"
import { ExplorePage } from "../features/explore/ExplorePage"
import { InsightsPage } from "../features/insights/InsightsPage"
import { ThemePreferencesProvider } from "../features/preferences/ThemePreferencesProvider"
import { SettingsPage } from "../features/settings/SettingsPage"
import { WorkspacePage } from "../features/workspaces/WorkspacePage"
import { AppShell } from "./AppShell"

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/all" replace />} />
        <Route
          element={
            <ThemePreferencesProvider>
              <AppShell />
            </ThemePreferencesProvider>
          }>
          <Route path="/all" element={<AllPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/all" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
