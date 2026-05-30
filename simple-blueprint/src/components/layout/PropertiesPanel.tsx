import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useEditor } from "@/store/useEditor"
import { toDisplay, fromDisplay, round2 } from "@/lib/units"
import type { ElementPatch } from "@/types/blueprint"
import { RichTextToolbar } from "@/components/RichTextToolbar"
import {
  HugeiconsIcon,
  DeleteIcon,
  BringForwardIcon,
  SendBackwardIcon,
} from "@/components/icons"

function hexOr(color: string, fallback = "#1f2937"): string {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : fallback
}

/** Numeric field that edits a canonical-meter value through the display unit. */
function MeterField({
  label,
  meters,
  unit,
  onCommit,
}: {
  label: string
  meters: number
  unit: "m" | "cm"
  onCommit: (meters: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          step="0.1"
          min="0"
          className="h-8 w-20"
          defaultValue={round2(toDisplay(meters, unit))}
          key={`${label}-${round2(toDisplay(meters, unit))}`}
          onBlur={(e) => {
            const v = Number(e.target.value)
            if (Number.isFinite(v) && v > 0) onCommit(fromDisplay(v, unit))
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur()
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
      <div className="bg-card text-muted-foreground w-64 border-l p-4 text-sm">
        Select an element to edit its properties, or pick a shape tool to add
        one.
      </div>
    )
  }

  // pushHistory once, then patch (used for discrete property edits)
  const edit = (patch: ElementPatch) => {
    pushHistory()
    update(el.id, patch)
  }

  const setLength = (len: number) => {
    if (el.type !== "line" && el.type !== "arrow") return
    const dx = el.x2 - el.x
    const dy = el.y2 - el.y
    const ang = Math.atan2(dy, dx) || 0
    edit({ x2: el.x + len * Math.cos(ang), y2: el.y + len * Math.sin(ang) })
  }

  const hasFill = el.type === "rectangle" || el.type === "ellipse" || el.type === "text"

  return (
    <div className="bg-card w-64 space-y-4 overflow-y-auto border-l p-4">
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
        <p className="text-xs font-medium">Dimensions</p>
        {(el.type === "rectangle" || el.type === "text") && (
          <>
            <MeterField label="Width" meters={el.w} unit={unit} onCommit={(w) => edit({ w })} />
            <MeterField label="Height" meters={el.h} unit={unit} onCommit={(h) => edit({ h })} />
          </>
        )}
        {el.type === "ellipse" && (
          <>
            <MeterField label="Width" meters={el.rx * 2} unit={unit} onCommit={(d) => edit({ rx: d / 2 })} />
            <MeterField label="Height" meters={el.ry * 2} unit={unit} onCommit={(d) => edit({ ry: d / 2 })} />
          </>
        )}
        {(el.type === "line" || el.type === "arrow") && (
          <MeterField
            label="Length"
            meters={Math.hypot(el.x2 - el.x, el.y2 - el.y)}
            unit={unit}
            onCommit={setLength}
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
          onCommit={(strokeWidth) => edit({ strokeWidth })}
        />
      </div>

      {/* Fill */}
      {hasFill && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium">
              {el.type === "text" ? "Background" : "Fill"}
            </p>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-muted-foreground text-xs">Filled</Label>
              <input
                type="checkbox"
                className="size-4"
                checked={el.fill !== "none"}
                onChange={(e) => edit({ fill: e.target.checked ? "#dbeafe" : "none" })}
              />
            </div>
            {el.fill !== "none" && (
              <div className="flex items-center justify-between gap-2">
                <Label className="text-muted-foreground text-xs">Color</Label>
                <input
                  type="color"
                  className="h-8 w-10 cursor-pointer rounded border"
                  value={hexOr(el.fill, "#dbeafe")}
                  onChange={(e) => edit({ fill: e.target.value })}
                />
              </div>
            )}
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
            <MeterField
              label="Font size"
              meters={el.fontSize}
              unit={unit}
              onCommit={(fontSize) => edit({ fontSize })}
            />
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
