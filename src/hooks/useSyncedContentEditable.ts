import { useEffect, useRef } from "react"

/**
 * Keep a contentEditable box in sync with stored html.
 *
 * A text element can be edited from two places at once — in place on the canvas
 * and from the properties panel — so each box has to pick up changes made in
 * the other. The rule both need is the same: write the markup in, but never
 * while the caret is inside this box, because replacing innerHTML under the
 * cursor moves it to the start mid-word.
 *
 * `active` covers boxes that are only mounted while editing: flipping it on
 * loads the content, and `focusOnMount` then puts the caret there.
 */
export function useSyncedContentEditable(
  html: string,
  {
    active = true,
    focusOnMount = false,
  }: { active?: boolean; focusOnMount?: boolean } = {},
) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!active || !node || document.activeElement === node) return
    if (node.innerHTML !== html) node.innerHTML = html
  }, [active, html])

  // Declared after the sync effect so the box already holds its content when
  // the caret lands in it.
  useEffect(() => {
    if (active && focusOnMount) ref.current?.focus()
  }, [active, focusOnMount])

  return ref
}
