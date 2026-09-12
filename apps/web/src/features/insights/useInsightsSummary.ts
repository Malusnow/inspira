import {
  normalizeInsightsTimeZone,
  type InsightsSummary
} from "@inspira/contracts"
import { useConvexAuth, useQuery } from "convex/react"

import { api } from "../../../../../convex/_generated/api"

/**
 * Reads the owner's insights aggregate. The browser's IANA time zone is sent
 * with the query so the server can resolve day, week and month boundaries the
 * same way the user experiences them.
 */
export function useInsightsSummary() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()
  const timeZone = normalizeInsightsTimeZone(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )
  const summary = useQuery(
    api.insights.summary,
    isAuthenticated ? { timeZone } : "skip"
  ) as InsightsSummary | undefined

  return {
    summary,
    isAuthenticated,
    isLoading: isAuthLoading || (isAuthenticated && summary === undefined)
  }
}
