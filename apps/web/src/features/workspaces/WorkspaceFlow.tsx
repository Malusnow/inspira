import type { InspirationItem, WorkspaceDetail } from "@inspira/contracts"
import { ArrowLeftIcon, DeleteIcon, RollbackIcon } from "tdesign-icons-react"

import { ContextMenu } from "../../components/ContextMenu"
import { useResponsiveColumnCount } from "../../hooks/useResponsiveColumnCount"
import { NoteCard } from "../all/NoteCard"
import { NoteMasonrySection } from "../all/NoteMasonrySection"

/** Workspace detail keeps a single four-column layout (no view switching). */
const WORKSPACE_COLUMN_COUNT = 4 as const

export interface WorkspaceFlowProps {
  workspace: WorkspaceDetail | undefined
  onBack: () => void
  onOpenNote: (note: InspirationItem) => void
  onEditNote: (note: InspirationItem) => void
  onRequestRemoveItem: (note: InspirationItem) => void
  onRequestDeleteItem: (note: InspirationItem) => void
}

export function WorkspaceFlow({
  workspace,
  onBack,
  onOpenNote,
  onEditNote,
  onRequestRemoveItem,
  onRequestDeleteItem
}: WorkspaceFlowProps) {
  const columnCount = useResponsiveColumnCount(WORKSPACE_COLUMN_COUNT)

  return (
    // No extra top padding here: the header starts exactly where the overview
    // title does, so entering a workspace reads as the same page continuing.
    <div className="min-h-[calc(100svh-8rem)]">
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="返回工作区"
          onClick={onBack}
          className="grid size-8 shrink-0 place-items-center rounded-full text-ink-muted transition hover:-translate-x-0.5 hover:bg-surface-hover hover:text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
          <ArrowLeftIcon className="size-4" />
        </button>
        <h1 className="min-w-0 truncate font-serif text-[24px] font-normal italic leading-tight tracking-normal text-ink-strong sm:text-[28px]">
          {workspace?.name ?? ""}
        </h1>
      </div>
      <div className="mt-5 h-px w-full bg-line" />

      <NoteMasonrySection
        notes={workspace?.items}
        columnCount={columnCount}
        className="mt-8 pb-[60px]"
        emptyState={
          <p className="mt-16 select-none text-center text-sm text-ink-muted/60">
            这个工作区还没有灵感，去 All 里把灵感放进来吧
          </p>
        }
        renderCard={(note) => (
          <ContextMenu
            label="卡片操作"
            items={[
              {
                id: "remove",
                label: "从工作区移除",
                icon: <RollbackIcon className="size-4" />,
                onSelect: () => onRequestRemoveItem(note)
              },
              {
                id: "delete",
                label: "删除卡片",
                intent: "danger",
                icon: <DeleteIcon className="size-4" />,
                onSelect: () => onRequestDeleteItem(note)
              }
            ]}>
            <NoteCard note={note} onOpen={onOpenNote} onEdit={onEditNote} />
          </ContextMenu>
        )}
      />
    </div>
  )
}
