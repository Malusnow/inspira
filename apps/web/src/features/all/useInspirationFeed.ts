import type { InspirationItem } from "@inspira/contracts"
import { useConvexAuth, usePaginatedQuery } from "convex/react"

import { api } from "../../../../../convex/_generated/api"

export const INSPIRATION_PAGE_SIZE = 30

export function useInspirationFeed() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()
  const { results, status, loadMore } = usePaginatedQuery(
    api.inspirations.listMine,
    isAuthenticated ? {} : "skip",
    { initialNumItems: INSPIRATION_PAGE_SIZE }
  )
  const isInitialLoading =
    isAuthLoading || (isAuthenticated && status === "LoadingFirstPage")
  const notes = (
    isInitialLoading ? undefined : isAuthenticated ? results : []
  ) as InspirationItem[] | undefined

  return {
    notes,
    isAuthenticated,
    isLoading: isInitialLoading,
    canLoadMore: status === "CanLoadMore",
    isLoadingMore: status === "LoadingMore",
    loadMore() {
      loadMore(INSPIRATION_PAGE_SIZE)
    }
  }
}
