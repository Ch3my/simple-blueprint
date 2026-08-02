// Values and types shared by the properties panel sections. Kept out of
// fields.tsx so that file exports only components — mixing the two breaks Vite's
// fast refresh, which then reloads the whole app instead of the edited section.

import type { Element, ElementPatch, LabelColor, LabelPosition } from "@/types/blueprint"

/** Font sizes are stored in meters; the UI shows them in em at this scale. */
export const EM_TO_METERS = 0.2

/** A usable hex colour, or the fallback when the stored value is not one. */
export function hexOr(color: string, fallback = "#1f2937"): string {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : fallback
}

export const LABEL_COLOR_OPTIONS: { value: LabelColor; label: string }[] = [
  { value: "gray",   label: "Gray" },
  { value: "green",  label: "Green" },
  { value: "sky",    label: "Sky" },
  { value: "purple", label: "Purple" },
  { value: "red",    label: "Red" },
]

export const LABEL_POSITIONS: LabelPosition[] = [
  "top-left",    "top-center",    "top-right",
  "middle-left", "middle-center", "middle-right",
  "bottom-left", "bottom-center", "bottom-right",
]

export interface SectionProps {
  el: Element
  unit: "m" | "cm"
  /** Write a patch to the selected element. Records its own undo entry. */
  update: (patch: ElementPatch) => void
  /** Bracket a run of edits (typing in a field) into one undo entry. */
  beginGesture: () => void
  endGesture: () => void
}
