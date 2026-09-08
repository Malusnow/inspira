import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AppShell } from "./AppShell"
import { AllPage } from "../features/all/AllPage"
import { ExplorePage } from "../features/explore/ExplorePage"
import { WorkspacePage } from "../features/workspaces/WorkspacePage"

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/all" replace />} />
        <Route element={<AppShell />}>
          <Route path="/all" element={<AllPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/explore" element={<ExplorePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/all" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
