import type { GenericId } from "convex/values"

export type Id<TableName extends string> = GenericId<TableName>

export type Doc<TableName extends string> = TableName extends "inspirations"
  ? {
      _id: Id<"inspirations">
      _creationTime: number
      ownerId: string
      type: "note"
      title?: string
      content: string
      tags: string[]
      workspaceId?: string
      createdAt: number
      updatedAt: number
    }
  : never

export type DataModel = {
  inspirations: {
    document: Doc<"inspirations">
    fieldPaths:
      | "_id"
      | "_creationTime"
      | "ownerId"
      | "type"
      | "title"
      | "content"
      | "tags"
      | "workspaceId"
      | "createdAt"
      | "updatedAt"
    indexes: {
      by_owner_createdAt: ["ownerId", "createdAt"]
    }
    searchIndexes: {}
    vectorIndexes: {}
  }
}
