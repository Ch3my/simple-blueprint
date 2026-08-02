import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toDisplay, fromDisplay, round4 } from "@/lib/units"
import type { Element, ElementPatch, LabelColor, LabelPosition } from "@/types/blueprint"

export const EM_TO_METERS = 0.2

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

export function MeterField({
  label,
  meters,
  unit,
  onStart,
  onEnd,
  onChange,
}: {
  label: string
  meters: number
  unit: "m" | "cm"
  onStart: () => void
  onEnd: () => void
  onChange: (meters: number) => void
}) {
  const [text, setText] = useState(String(round4(toDisplay(meters, unit))))
  const [focused, setFocused] = useState(false)

  // Reflect external changes (drag/resize, unit switch) when not actively typing.
  useEffect(() => {
    if (!focused) setText(String(round4(toDisplay(meters, unit))))
  }, [meters, unit, focused])

  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          step="0.1"
          min="0"
          className="h-8 w-20"
          value={text}
          onFocus={() => { setFocused(true); onStart() }}
          onBlur={() => { setFocused(false); onEnd() }}
          onChange={(e) => {
            setText(e.target.value)
            const v = Number(e.target.value)
            if (Number.isFinite(v) && v > 0) onChange(fromDisplay(v, unit))
          }}
        />
        <span className="text-muted-foreground w-5 text-xs">{unit}</span>
      </div>
    </div>
  )
}

export function RotationField({
  degrees,
  onStart,
  onEnd,
  onChange,
}: {
  degrees: number
  onStart: () => void
  onEnd: () => void
  onChange: (deg: number) => void
}) {
  const [text, setText] = useState(String(Math.round(degrees)))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(String(Math.round(degrees)))
  }, [degrees, focused])

  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-muted-foreground text-xs">Rotation</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          step="1"
          className="h-8 w-20"
          value={text}
          onFocus={() => { setFocused(true); onStart() }}
          onBlur={() => { setFocused(false); onEnd() }}
          onChange={(e) => {
            setText(e.target.value)
            const v = Number(e.target.value)
            if (Number.isFinite(v)) onChange(Math.round(v))
          }}
        />
        <span className="text-muted-foreground w-5 text-xs">°</span>
      </div>
    </div>
  )
}

export function FontSizeField({
  meters,
  onStart,
  onEnd,
  onChange,
}: {
  meters: number
  onStart: () => void
  onEnd: () => void
  onChange: (meters: number) => void
}) {
  const toEm = (m: number) => round4(m / EM_TO_METERS)
  const [text, setText] = useState(String(toEm(meters)))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(String(toEm(meters)))
  }, [meters, focused])

  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-muted-foreground text-xs">Font size</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          step="0.1"
          min="0.1"
          className="h-8 w-20"
          value={text}
          onFocus={() => { setFocused(true); onStart() }}
          onBlur={() => { setFocused(false); onEnd() }}
          onChange={(e) => {
            setText(e.target.value)
            const v = Number(e.target.value)
            if (Number.isFinite(v) && v > 0) onChange(v * EM_TO_METERS)
          }}
        />
        <span className="text-muted-foreground w-5 text-xs">em</span>
      </div>
    </div>
  )
}
