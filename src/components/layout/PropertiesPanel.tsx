import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toggle } from "@/components/ui/toggle"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEditor } from "@/store/useEditor"
import { toDisplay, fromDisplay, round4 } from "@/lib/units"
import type { ElementPatch, LabelColor } from "@/types/blueprint"
import { RichTextToolbar } from "@/components/RichTextToolbar"
import {
  HugeiconsIcon,
  DeleteIcon,
  BringForwardIcon,
  SendBackwardIcon,
} from "@/components/icons"

const LABEL_COLOR_OPTIONS: { value: LabelColor; label: string }[] = [
  { value: "gray",   label: "Gray" },
  { value: "green",  label: "Green" },
  { value: "sky",    label: "Sky" },
  { value: "purple", label: "Purple" },
  { value: "red",    label: "Red" },
]

function hexOr(color: string, fallback = "#1f2937"): string {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : fallback
}

/**
 * Numeric field that edits a canonical-meter value through the display unit.
 * Updates live as you type. `onStart` records a single undo step when editing
 * begins; `onChange` applies each keystroke (without spamming history).
 */
// 1 em = the default text element font size (0.2 m)
const EM_TO_METERS = 0.2

function FontSizeField({
  meters,
  onStart,
  onChange,
}: {
  meters: number
  onStart: () => void
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
          onBlur={() => setFocused(false)}
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

function MeterField({
  label,
  meters,
  unit,
  onStart,
  onChange,
}: {
  label: string
  meters: number
  unit: "m" | "cm"
  onStart: () => void
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
          onFocus={() => {
            setFocused(true)
            onStart()
          }}
          onBlur={() => setFocused(false)}
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

export function PropertiesPanel() {
  const selectedId = useEditor((s) => s.selectedId)
  const el = useEditor((s) => s.elements.find((e) => e.id === selectedId))
  const unit = useEditor((s) => s.settings.unit)
  const update = useEditor((s) => s.updateElement)
  const pushHistory = useEditor((s) => s.pushHistory)
  const removeElement = useEditor((s) => s.removeElement)
  const bringForward = useEditor((s) => s.bringForward)
  const sendBackward = useEditor((s) => s.sendBackward)

  if (!el) {
    return (
      <div className="bg-card text-muted-foreground h-full w-64 border-l p-4 text-sm">
        Selecciona un elemento para editar sus propiedades, o elige una herramienta de forma para añadir uno.
      </div>
    )
  }

  // pushHistory once, then patch (used for discrete property edits: color, toggle, order)
  const edit = (patch: ElementPatch) => {
    pushHistory()
    update(el.id, patch)
  }

  // Live patch with no history snapshot (MeterField records history on focus).
  const patch = (p: ElementPatch) => update(el.id, p)

  const setLength = (len: number) => {
    if (el.type !== "line" && el.type !== "arrow") return
    const dx = el.x2 - el.x
    const dy = el.y2 - el.y
    const ang = Math.atan2(dy, dx) || 0
    patch({ x2: el.x + len * Math.cos(ang), y2: el.y + len * Math.sin(ang) })
  }

  const hasFill = el.type === "rectangle" || el.type === "ellipse" || el.type === "text"
  const hasHatching = el.type === "rectangle" || el.type === "ellipse"
  const isBoxDims = el.type === "rectangle" || el.type === "text" || el.type === "door" || el.type === "stairs"

  return (
    <div className="bg-card h-full w-64 space-y-4 overflow-y-auto border-l p-4">
      <div className="flex items-center justify-between">
        <span className="font-heading text-sm font-semibold capitalize">
          {el.type}
        </span>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Delete"
          onClick={() => {
            pushHistory()
            removeElement(el.id)
          }}
        >
          <HugeiconsIcon icon={DeleteIcon} size={16} />
        </Button>
      </div>

      <Separator />

      {/* Dimensions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">Dimensions</p>
          {el.type !== "text" && (
            <Toggle
              variant="outline"
              size="sm"
              pressed={el.showLabel !== false}
              onPressedChange={(on) => edit({ showLabel: on })}
            >
              {el.showLabel !== false ? "Label on" : "Label off"}
            </Toggle>
          )}
        </div>
        {isBoxDims && (
          <>
            <MeterField label="Width" meters={(el as { w: number }).w} unit={unit} onStart={pushHistory} onChange={(w) => patch({ w })} />
            <MeterField label="Height" meters={(el as { h: number }).h} unit={unit} onStart={pushHistory} onChange={(h) => patch({ h })} />
          </>
        )}
        {el.type === "door" && (
          <div className="flex items-center justify-between gap-2">
            <Label className="text-muted-foreground text-xs">Mirror</Label>
            <Toggle
              variant="outline"
              size="sm"
              pressed={el.flipX === true}
              onPressedChange={(on) => edit({ flipX: on })}
            >
              {el.flipX ? "Flipped" : "Normal"}
            </Toggle>
          </div>
        )}
        {el.type === "stairs" && (
          <div className="flex items-center justify-between gap-2">
            <Label className="text-muted-foreground text-xs">Steps</Label>
            <Input
              type="number"
              min="1"
              max="50"
              step="1"
              className="h-8 w-20"
              value={el.steps}
              onFocus={pushHistory}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (Number.isInteger(v) && v >= 1 && v <= 50) patch({ steps: v })
              }}
            />
          </div>
        )}
        {el.type === "ellipse" && (
          <>
            <MeterField label="Width" meters={el.rx * 2} unit={unit} onStart={pushHistory} onChange={(d) => patch({ rx: d / 2 })} />
            <MeterField label="Height" meters={el.ry * 2} unit={unit} onStart={pushHistory} onChange={(d) => patch({ ry: d / 2 })} />
          </>
        )}
        {(el.type === "line" || el.type === "arrow") && (
          <MeterField
            label="Length"
            meters={Math.hypot(el.x2 - el.x, el.y2 - el.y)}
            unit={unit}
            onStart={pushHistory}
            onChange={setLength}
          />
        )}
      </div>

      <Separator />

      {/* Stroke */}
      <div className="space-y-2">
        <p className="text-xs font-medium">Stroke</p>
        <div className="flex items-center justify-between gap-2">
          <Label className="text-muted-foreground text-xs">Color</Label>
          <input
            type="color"
            className="h-8 w-10 cursor-pointer rounded border"
            value={hexOr(el.stroke)}
            onChange={(e) => edit({ stroke: e.target.value })}
          />
        </div>
        <MeterField
          label="Thickness"
          meters={el.strokeWidth}
          unit={unit}
          onStart={pushHistory}
          onChange={(strokeWidth) => patch({ strokeWidth })}
        />
        {el.type !== "text" && (
          <div className="flex items-center justify-between gap-2">
            <Label className="text-muted-foreground text-xs">Contour</Label>
            <Toggle
              variant="outline"
              size="sm"
              pressed={el.strokeStyle === "dashed"}
              onPressedChange={(on) =>
                edit({ strokeStyle: on ? "dashed" : "solid" })
              }
            >
              {el.strokeStyle === "dashed" ? "Dashed" : "Solid"}
            </Toggle>
          </div>
        )}
      </div>

      {/* Fill */}
      {hasFill && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium">
              {el.type === "text" ? "Background" : "Fill"}
            </p>
            {hasHatching && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-muted-foreground text-xs">Hatch</Label>
                  <Toggle
                    variant="outline"
                    size="sm"
                    pressed={el.hatching === true}
                    onPressedChange={(on) => edit({ hatching: on })}
                  >
                    {el.hatching ? "On" : "Off"}
                  </Toggle>
                </div>
                {el.hatching && (
                  <MeterField
                    label="Spacing"
                    meters={el.hatchSpacing ?? 0.1}
                    unit={unit}
                    onStart={pushHistory}
                    onChange={(hatchSpacing) => patch({ hatchSpacing })}
                  />
                )}
              </>
            )}
            <div className="flex items-center justify-between gap-2">
              <Toggle
                variant="outline"
                size="sm"
                pressed={el.fill !== "none"}
                onPressedChange={(on) =>
                  edit({ fill: on ? "#dbeafe" : "none" })
                }
              >
                {el.fill !== "none" ? "Filled" : "No fill"}
              </Toggle>
              {el.fill !== "none" && (
                <input
                  type="color"
                  className="h-8 w-10 cursor-pointer rounded border"
                  value={hexOr(el.fill, "#dbeafe")}
                  onChange={(e) => edit({ fill: e.target.value })}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Text */}
      {el.type === "text" && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium">Text</p>
            <RichTextToolbar el={el} />
            <div className="flex items-center justify-between gap-2">
              <Label className="text-muted-foreground text-xs">Color</Label>
              <input
                type="color"
                className="h-8 w-10 cursor-pointer rounded border"
                value={hexOr(el.color)}
                onChange={(e) => edit({ color: e.target.value })}
              />
            </div>
            <FontSizeField
              meters={el.fontSize}
              onStart={pushHistory}
              onChange={(fontSize) => patch({ fontSize })}
            />
            <div className="flex items-center justify-between gap-2">
              <Label className="text-muted-foreground text-xs">Label</Label>
              <Toggle
                variant="outline"
                size="sm"
                pressed={el.labelMode === true}
                onPressedChange={(on) => edit({ labelMode: on })}
              >
                {el.labelMode ? "On" : "Off"}
              </Toggle>
            </div>
            {el.labelMode && (
              <div className="flex items-center justify-between gap-2">
                <Label className="text-muted-foreground text-xs">Color</Label>
                <Select
                  value={el.labelColor ?? "gray"}
                  onValueChange={(v) => edit({ labelColor: v as LabelColor })}
                >
                  <SelectTrigger size="sm" className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LABEL_COLOR_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </>
      )}

      <Separator />

      {/* Order */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => {
            pushHistory()
            bringForward(el.id)
          }}
        >
          <HugeiconsIcon icon={BringForwardIcon} size={14} /> Front
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => {
            pushHistory()
            sendBackward(el.id)
          }}
        >
          <HugeiconsIcon icon={SendBackwardIcon} size={14} /> Back
        </Button>
      </div>
    </div>
  )
}
