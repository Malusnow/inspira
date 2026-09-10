import type { WorkspaceSummary } from "@inspira/contracts"

import { CreateWorkspaceTile } from "./CreateWorkspaceTile"
import { WorkspaceTile } from "./WorkspaceTile"

export interface WorkspaceOverviewProps {
  workspaces: WorkspaceSummary[]
  onCreate: () => void
  onOpenWorkspace: (workspaceId: string) => void
  onRename: (workspaceId: string) => void
  onRequestDelete: (workspaceId: string) => void
}

export function WorkspaceOverview({
  workspaces,
  onCreate,
  onOpenWorkspace,
  onRename,
  onRequestDelete
}: WorkspaceOverviewProps) {
  return (
    <>
      <h1 className="font-serif text-[38px] font-normal italic leading-tight tracking-normal text-ink-strong sm:text-[48px]">
        Workspaces
      </h1>

      <div className="mt-12 grid grid-cols-[repeat(auto-fill,minmax(180px,220px))] justify-start gap-x-10 gap-y-12">
        <CreateWorkspaceTile onCreate={onCreate} />
        {workspaces.map((workspace) => (
          <WorkspaceTile
            key={workspace.id}
            workspace={workspace}
            onOpen={onOpenWorkspace}
            onRename={onRename}
            onRequestDelete={onRequestDelete}
          />
        ))}
      </div>
    </>
  )
}
