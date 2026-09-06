import type { FunctionReference } from "convex/server"

export declare const api: {
  notes: {
    create: FunctionReference<
      "mutation",
      "public",
      {
        title?: string
        content: string
        tags?: string[]
        workspaceId?: string
      },
      string
    >
    listMine: FunctionReference<"query", "public", Record<string, never>, unknown>
    getMine: FunctionReference<
      "query",
      "public",
      {
        id: string
      },
      unknown
    >
  }
}
