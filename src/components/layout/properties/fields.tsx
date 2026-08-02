import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toDisplay, fromDisplay, round4 } from "@/lib/units"
import { EM_TO_METERS } from "./shared"

/**
 * Number inputs in the panel show the element's value, except while you are
 * typing in them. A half-finished entry like "1." or "" is not a valid number,
 * so rewriting the box from the element on every keystroke would fight the
 * cursor. Each field therefore keeps a draft string that exists only while it
 * has focus: `draft ?? external` shows the draft when there is one and the live
 * element value the rest of the time, which is why none of this needs an effect.
 */
function useDraft(external: string) {
  const [draft, setDraft] = useState<string | null>(null)
  return {
    value: draft ?? external,
    begin: () => setDraft(external),
    edit: setDraft,
    end: () => setDraft(null),
  }
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
  const draft = useDraft(String(round4(toDisplay(meters, unit))))

  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          step="0.1"
          min="0"
          className="h-8 w-20"
          value={draft.value}
          onFocus={() => { draft.begin(); onStart() }}
          onBlur={() => { draft.end(); onEnd() }}
          onChange={(e) => {
            draft.edit(e.target.value)
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
  const draft = useDraft(String(Math.round(degrees)))

  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-muted-foreground text-xs">Rotation</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          step="1"
          className="h-8 w-20"
          value={draft.value}
          onFocus={() => { draft.begin(); onStart() }}
          onBlur={() => { draft.end(); onEnd() }}
          onChange={(e) => {
            draft.edit(e.target.value)
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
  const draft = useDraft(String(round4(meters / EM_TO_METERS)))

  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-muted-foreground text-xs">Font size</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          step="0.1"
          min="0.1"
          className="h-8 w-20"
          value={draft.value}
          onFocus={() => { draft.begin(); onStart() }}
          onBlur={() => { draft.end(); onEnd() }}
          onChange={(e) => {
            draft.edit(e.target.value)
            const v = Number(e.target.value)
            if (Number.isFinite(v) && v > 0) onChange(v * EM_TO_METERS)
          }}
        />
        <span className="text-muted-foreground w-5 text-xs">em</span>
      </div>
    </div>
  )
}
