import type { InspirationItem } from "@inspira/contracts"
import { useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { MessagePlugin } from "tdesign-react"

import type { AppShellOutletContext } from "../../app/AppShell"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import { NoteDetailDialog } from "../all/NoteDetail"
import { useNoteDeletion } from "../all/useNoteDeletion"
import {
  useWorkspaceDetailData,
  useWorkspaceMutations,
  useWorkspaceOverviewData,
  type WorkspacePendingAction
} from "./useWorkspaces"
import { WorkspaceFlow } from "./WorkspaceFlow"
import { WorkspaceNameDialog } from "./WorkspaceNameDialog"
import { WorkspaceOverview } from "./WorkspaceOverview"

export function WorkspacePage() {
  const workspaces = useWorkspaceOverviewData()
  const {
    createWorkspace,
    renameWorkspace,
    removeWorkspace,
    removeWorkspaceItem
  } = useWorkspaceMutations()
  const { openNoteOverlay } = useOutletContext<AppShellOutletContext>()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  )
  const selectedWorkspace = useWorkspaceDetailData(selectedWorkspaceId)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createError, setCreateError] = useState<string | undefined>()
  const [renameError, setRenameError] = useState<string | undefined>()
  // One in-flight action for the whole page, so no two confirms can overlap.
  const [pendingAction, setPendingAction] =
    useState<WorkspacePendingAction | null>(null)
  const [workspacePendingDelete, setWorkspacePendingDelete] = useState<
    string | null
  >(null)
  const [workspacePendingRename, setWorkspacePendingRename] = useState<
    string | null
  >(null)
  const [itemPendingRemove, setItemPendingRemove] =
    useState<InspirationItem | null>(null)
  // Deleting a card is a Notes concern, so it goes straight through the same
  // hook the All page and the note detail use.
  const {
    pendingNote: itemPendingDelete,
    isDeleting: isDeletingItem,
    requestDelete: requestDeleteItem,
    cancel: cancelDeleteItem,
    confirm: confirmDeleteItem
  } = useNoteDeletion()
  const isBusy = pendingAction !== null
  const workspaceNames = useMemo(
    () => workspaces?.map((workspace) => workspace.name) ?? [],
    [workspaces]
  )
  const renameTargetName =
    workspaces?.find((workspace) => workspace.id === workspacePendingRename)
      ?.name ?? ""
  const renameSiblingNames = useMemo(
    () =>
      workspaces
        ?.filter((workspace) => workspace.id !== workspacePendingRename)
        .map((workspace) => workspace.name) ?? [],
    [workspaces, workspacePendingRename]
  )
  // Derived from the detail query: moving or deleting a card then refreshes or
  // closes the detail layer without a manual patch.
  const selectedNote = useMemo(
    () =>
      selectedNoteId
        ? selectedWorkspace?.items.find((item) => item.id === selectedNoteId) ??
          null
        : null,
    [selectedNoteId, selectedWorkspace]
  )

  async function handleCreateWorkspace(name: string) {
    setPendingAction("create")
    setCreateError(undefined)

    try {
      const workspaceId = await createWorkspace(name)
      setIsCreateDialogOpen(false)
      setSelectedWorkspaceId(workspaceId)
      void MessagePlugin.success({
        content: "工作区已创建",
        placement: "bottom-right"
      })
    } catch (error) {
      console.error("Failed to create workspace", error)
      setCreateError("创建失败，请检查名称后重试")
    } finally {
      setPendingAction(null)
    }
  }

  async function handleRenameWorkspace(name: string) {
    if (!workspacePendingRename || isBusy) return

    setPendingAction("rename")
    setRenameError(undefined)

    try {
      await renameWorkspace(workspacePendingRename, name)
      setWorkspacePendingRename(null)
      void MessagePlugin.success({
        content: "工作区已重命名",
        placement: "bottom-right"
      })
    } catch (error) {
      console.error("Failed to rename workspace", error)
      setRenameError("重命名失败，请检查名称后重试")
    } finally {
      setPendingAction(null)
    }
  }

  async function handleDeleteWorkspace() {
    if (!workspacePendingDelete || isBusy) return

    setPendingAction("delete-workspace")

    try {
      await removeWorkspace(workspacePendingDelete)
      if (selectedWorkspaceId === workspacePendingDelete) {
        setSelectedWorkspaceId(null)
        setSelectedNoteId(null)
      }
      setWorkspacePendingDelete(null)
      void MessagePlugin.success({
        content: "工作区已删除，内容仍保留在 All",
        placement: "bottom-right"
      })
    } catch (error) {
      console.error("Failed to delete workspace", error)
      void MessagePlugin.error({
        content: "删除工作区失败，请稍后再试",
        placement: "bottom-right"
      })
    } finally {
      setPendingAction(null)
    }
  }

  async function handleRemoveItem() {
    if (!itemPendingRemove || !selectedWorkspaceId || isBusy) return

    setPendingAction("remove-item")

    try {
      await removeWorkspaceItem(selectedWorkspaceId, itemPendingRemove.id)
      setItemPendingRemove(null)
      void MessagePlugin.success({
        content: "已从工作区移除，灵感仍保留在 All",
        placement: "bottom-right"
      })
    } catch (error) {
      console.error("Failed to remove workspace item", error)
      void MessagePlugin.error({
        content: "移除失败，请稍后再试",
        placement: "bottom-right"
      })
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <section className="mx-auto min-h-[calc(100svh-84px)] w-full max-w-[1280px] px-5 pb-14 pt-10 sm:px-8 lg:px-12">
      {/*
        Remounting on the selected workspace replays the entry animation, so
        opening and leaving a workspace reads as one continuous page instead of
        an abrupt swap.
      */}
      <div key={selectedWorkspaceId ?? "overview"} className="page-transition">
        {selectedWorkspaceId ? (
          <WorkspaceFlow
            workspace={selectedWorkspace}
            onBack={() => {
              setSelectedWorkspaceId(null)
              setSelectedNoteId(null)
            }}
            onOpenNote={(note) => setSelectedNoteId(note.id)}
            onEditNote={openNoteOverlay}
            onRequestRemoveItem={setItemPendingRemove}
            onRequestDeleteItem={requestDeleteItem}
          />
        ) : (
          <WorkspaceOverview
            workspaces={workspaces ?? []}
            onCreate={() => setIsCreateDialogOpen(true)}
            onOpenWorkspace={setSelectedWorkspaceId}
            onRename={setWorkspacePendingRename}
            onRequestDelete={setWorkspacePendingDelete}
          />
        )}
      </div>

      <WorkspaceNameDialog
        visible={isCreateDialogOpen}
        title="创建新工作区"
        description="工作区是一组灵感的集合，可直接添加，或从 All 里挑选卡片加入。"
        placeholder="为工作区取个名字"
        submitText="创建"
        pendingText="创建中…"
        existingNames={workspaceNames}
        error={createError}
        isLoading={pendingAction === "create"}
        onCancel={() => {
          setCreateError(undefined)
          setIsCreateDialogOpen(false)
        }}
        onSubmit={handleCreateWorkspace}
      />

      <WorkspaceNameDialog
        visible={Boolean(workspacePendingRename)}
        title="重命名工作区"
        placeholder="工作区名称"
        submitText="保存"
        pendingText="保存中…"
        initialName={renameTargetName}
        currentName={renameTargetName}
        existingNames={renameSiblingNames}
        error={renameError}
        isLoading={pendingAction === "rename"}
        onCancel={() => {
          setRenameError(undefined)
          setWorkspacePendingRename(null)
        }}
        onSubmit={handleRenameWorkspace}
      />

      <ConfirmDialog
        visible={Boolean(workspacePendingDelete)}
        isLoading={pendingAction === "delete-workspace"}
        title="删除这个工作区？"
        description="只删除工作区，不会删除工作区里的灵感。"
        confirmText="删除"
        cancelText="取消"
        intent="danger"
        onCancel={() => {
          if (!isBusy) setWorkspacePendingDelete(null)
        }}
        onConfirm={() => void handleDeleteWorkspace()}
      />

      <ConfirmDialog
        visible={Boolean(itemPendingRemove)}
        isLoading={pendingAction === "remove-item"}
        title="把这张卡片移出工作区？"
        description="只会解除工作区归属，灵感本身仍保留在 All。"
        confirmText="移出"
        cancelText="取消"
        intent="danger"
        onCancel={() => {
          if (!isBusy) setItemPendingRemove(null)
        }}
        onConfirm={() => void handleRemoveItem()}
      />

      <ConfirmDialog
        visible={Boolean(itemPendingDelete)}
        isLoading={isDeletingItem}
        title="删除这张卡片？"
        description="删除后不可恢复，不会再出现在 All 里。"
        confirmText="删除"
        cancelText="取消"
        intent="danger"
        onCancel={cancelDeleteItem}
        onConfirm={() => void confirmDeleteItem()}
      />

      <NoteDetailDialog
        note={selectedNote}
        onClose={() => setSelectedNoteId(null)}
      />
    </section>
  )
}
