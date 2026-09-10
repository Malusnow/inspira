import type {
  WorkspacePreview as WorkspacePreviewValue,
  WorkspacePreviewItem
} from "@inspira/contracts"
import { PlayCircleIcon } from "tdesign-icons-react"
import { useState } from "react"

export interface WorkspacePreviewProps {
  name: string
  /** Total items in the workspace, used for the "+N" badge. */
  itemCount: number
  preview: WorkspacePreviewValue
}

/** How many stacked cards the preview renders at most. */
const PREVIEW_CARD_LIMIT = 3

interface CardOffset {
  x: number
  y: number
  rotate: number
}

interface CardPose {
  /** Tight stack, shown while the tile is at rest. */
  stacked: CardOffset
  /** Fanned out, shown while the tile is hovered or focused. */
  fanned: CardOffset
}

/**
 * Index 0 is the newest card and stays in front. Values are hand-tuned so the
 * stack sits inside the tile while the fan just barely escapes it, matching the
 * read of a physical pile of notes being spread out.
 */
const CARD_POSES: CardPose[] = [
  { stacked: { x: 0, y: 0, rotate: -2 }, fanned: { x: 0, y: -20, rotate: -5 } },
  { stacked: { x: -7, y: 6, rotate: 2 }, fanned: { x: -58, y: 10, rotate: -11 } },
  { stacked: { x: 8, y: 11, rotate: 4 }, fanned: { x: 60, y: 16, rotate: 9 } }
]

function toTransform({ x, y, rotate }: CardOffset) {
  return `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg)`
}

function getItemText(item: WorkspacePreviewItem) {
  return item.text ?? item.title ?? ""
}

/**
 * Front card rendering is driven by the item itself: `imageUrl` → image,
 * `type === "video"` → play placeholder, otherwise text. Today every item is a
 * Note, so the image/video branches stay dormant until media types exist.
 */
function CardFace({ item, name }: { item: WorkspacePreviewItem; name: string }) {
  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt={item.title ?? name}
        className="size-full object-cover"
      />
    )
  }

  if (item.type === "video") {
    return (
      <span className="grid size-full place-items-center bg-ink-strong/90 text-white">
        <PlayCircleIcon className="size-7" />
      </span>
    )
  }

  return (
    <span className="line-clamp-6 block size-full overflow-hidden px-3.5 py-3 text-[13px] leading-6 text-ink-strong">
      {getItemText(item)}
    </span>
  )
}

/**
 * Stacked preview that fans out on hover. A single tile therefore shows what is
 * actually inside a workspace instead of only the most recent card, and an empty
 * workspace reuses the create-circle visual language to say "Empty Space".
 */
export function WorkspacePreview({
  name,
  itemCount,
  preview
}: WorkspacePreviewProps) {
  const [isFanned, setFanned] = useState(false)
  const cards = preview.items.slice(0, PREVIEW_CARD_LIMIT)
  const extraCount = Math.max(0, itemCount - cards.length)

  if (cards.length === 0) {
    return (
      <span className="grid size-full place-items-center">
        <span className="workspace-empty-ring grid size-full place-items-center rounded-full p-[3px] transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none">
          <span className="workspace-empty-inner grid size-full place-items-center rounded-full">
            <span className="select-none text-center font-serif text-[16px] italic leading-5 text-ink-muted/80">
              Empty
              <br />
              Space
            </span>
          </span>
        </span>
      </span>
    )
  }

  return (
    <span
      className="relative block size-full"
      onPointerEnter={() => setFanned(true)}
      onPointerLeave={() => setFanned(false)}>
      {cards.map((item, index) => {
        const pose = CARD_POSES[index] ?? CARD_POSES[CARD_POSES.length - 1]

        return (
          <span
            key={item.id}
            aria-hidden={index > 0}
            className="absolute left-1/2 top-1/2 h-[78%] w-[62%] overflow-hidden rounded-lg border border-line/70 bg-surface shadow-[0_8px_20px_rgb(37_43_53/0.11)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{
              transform: toTransform(isFanned ? pose.fanned : pose.stacked),
              zIndex: 30 - index
            }}>
            <CardFace item={item} name={name} />
          </span>
        )
      })}

      {extraCount > 0 ? (
        <span
          aria-hidden
          className={`pointer-events-none absolute bottom-3 right-3 rounded-full border border-line/70 bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-ink-muted shadow-sm transition-opacity duration-200 ${
            isFanned ? "opacity-0" : "opacity-100"
          }`}>
          +{extraCount}
        </span>
      ) : null}
    </span>
  )
}
