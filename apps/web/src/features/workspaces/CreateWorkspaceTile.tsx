import { AddIcon } from "tdesign-icons-react"

export interface CreateWorkspaceTileProps {
  onCreate: () => void
}

/**
 * Creation entry rendered as a grid sibling of the workspace tiles. The circle
 * is sized to roughly match a workspace card (it keeps the same 1.28 preview
 * ratio box, so its diameter equals a tile's preview height).
 *
 * Hover and focus intentionally animate differently: hover continuously sweeps
 * the brand-scale ring, focus-visible gently breathes it and adds a soft halo.
 */
export function CreateWorkspaceTile({ onCreate }: CreateWorkspaceTileProps) {
  return (
    <article className="group relative w-full min-w-0 text-ink-strong">
      <button
        type="button"
        aria-label="创建工作区"
        onClick={onCreate}
        className="workspace-create block w-full min-w-0 border-0 bg-transparent p-0 text-left focus-visible:outline-none">
        <span className="grid aspect-square w-full place-items-center">
          <span className="workspace-create-ring grid size-full place-items-center rounded-full p-[3px] transition-transform duration-300">
            <span className="workspace-create-inner grid size-full place-items-center rounded-full text-ink-muted transition duration-300">
              <AddIcon className="size-9" />
            </span>
          </span>
        </span>
        <span className="mt-4 block truncate text-center text-[22px] font-semibold leading-tight text-ink-muted transition duration-300 group-hover:text-ink-strong group-focus-within:text-ink-strong sm:text-[24px]">
          新建工作区
        </span>
      </button>
    </article>
  )
}
