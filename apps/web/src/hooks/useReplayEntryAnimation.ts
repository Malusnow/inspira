import { useLayoutEffect, type RefObject } from "react"

/**
 * Replays a CSS entry animation on an element that stays mounted.
 *
 * Route and view switches used to replay their entry animation by remounting
 * the animated wrapper with a `key`, which also threw away everything inside it
 * (loaded previews, live snapshots, scroll position). Restarting the animation
 * keeps the same visual result without discarding the subtree.
 *
 * `stateKey` is the value that identifies one "page": replay it when the page
 * changes, exactly like the old `key` did.
 */
export function useReplayEntryAnimation(
  elementRef: RefObject<HTMLElement | null>,
  animationClassName: string,
  stateKey: string
) {
  useLayoutEffect(() => {
    const node = elementRef.current

    if (!node) return

    node.classList.remove(animationClassName)
    // Reading a layout property flushes the class removal; without it the
    // browser coalesces remove + add into "no change" and nothing restarts.
    void node.offsetWidth
    node.classList.add(animationClassName)
  }, [animationClassName, elementRef, stateKey])
}
