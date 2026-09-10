import type { WorkspaceSummary } from "@inspira/contracts"
import { DeleteIcon, EditIcon } from "tdesign-icons-react"

import { ContextMenu } from "../../components/ContextMenu"
import { WorkspacePreview } from "./WorkspacePreview"

export interface WorkspaceTileProps {
  workspace: WorkspaceSummary
  onOpen: (workspaceId: string) => void
  onRename: (workspaceId: string) => void
  onRequestDelete: (workspaceId: string) => void
}

export function WorkspaceTile({
  workspace,
  onOpen,
  onRename,
  onRequestDelete
}: WorkspaceTileProps) {
  return (
    // `hover:z-20` lets the fanned cards spill over neighbouring tiles without
    // being painted underneath them.
    <article className="group relative w-full min-w-0 text-ink-strong hover:z-20">
      <ContextMenu
        label="工作区操作"
        items={[
          {
            id: "rename",
            label: "重命名",
            icon: <EditIcon className="size-4" />,
            onSelect: () => onRename(workspace.id)
          },
          {
            id: "delete",
            label: "删除工作区",
            intent: "danger",
            icon: <DeleteIcon className="size-4" />,
            onSelect: () => onRequestDelete(workspace.id)
          }
        ]}>
        <button
          type="button"
          onClick={() => onOpen(workspace.id)}
          className="flex w-full min-w-0 flex-col items-stretch border-0 bg-transparent p-0 text-left text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4">
          <span className="relative block aspect-square w-full">
            <WorkspacePreview
              preview={workspace.preview}
              itemCount={workspace.itemCount}
              name={workspace.name}
            />
          </span>
          <span className="mt-4 block truncate text-center text-[22px] font-semibold leading-tight sm:text-[24px]">
            {workspace.name}
          </span>
        </button>
      </ContextMenu>
    </article>
  )
}