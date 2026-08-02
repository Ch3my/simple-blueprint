import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toggle } from "@/components/ui/toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HugeiconsIcon, SwapIcon } from "@/components/icons"
import { MeterField, RotationField, type SectionProps } from "./fields"

export function DimensionsSection({ el, unit, update, beginGesture, endGesture }: SectionProps) {
  const isBoxDims = el.type === "rectangle" || el.type === "text" || el.type === "door" || el.type === "stairs"

  // Swap the two dimensions in place (2x3 becomes 3x2). The top-left corner
  // stays put, matching what editing the Width/Height fields does.
  const swapDims = () => {
    if (el.type === "ellipse") update({ rx: el.ry, ry: el.rx })
    else if (isBoxDims) {
      const box = el as { w: number; h: number }
      update({ w: box.h, h: box.w })
    }
  }

  const setLength = (len: number) => {
    if (el.type !== "line" && el.type !== "arrow") return
    const dx = el.x2 - el.x
    const dy = el.y2 - el.y
    const ang = Math.atan2(dy, dx) || 0
    update({ x2: el.x + len * Math.cos(ang), y2: el.y + len * Math.sin(ang) })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">Dimensions</p>
        <div className="flex items-center gap-1">
          {(isBoxDims || el.type === "ellipse") && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="Swap width and height"
                  onClick={swapDims}
                >
                  <HugeiconsIcon icon={SwapIcon} size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Swap width / height</TooltipContent>
            </Tooltip>
          )}
          {el.type !== "text" && (
            <Toggle
              variant="outline"
              size="sm"
              pressed={el.showLabel !== false}
              onPressedChange={(on) => update({ showLabel: on })}
            >
              {el.showLabel !== false ? "Label on" : "Label off"}
            </Toggle>
          )}
        </div>
      </div>
      {isBoxDims && (
        <>
          <MeterField label="Width" meters={(el as { w: number }).w} unit={unit} onStart={beginGesture} onEnd={endGesture} onChange={(w) => update({ w })} />
          <MeterField label="Height" meters={(el as { h: number }).h} unit={unit} onStart={beginGesture} onEnd={endGesture} onChange={(h) => update({ h })} />
        </>
      )}
      {el.type === "ellipse" && (
        <>
          <MeterField label="Width" meters={el.rx * 2} unit={unit} onStart={beginGesture} onEnd={endGesture} onChange={(d) => update({ rx: d / 2 })} />
          <MeterField label="Height" meters={el.ry * 2} unit={unit} onStart={beginGesture} onEnd={endGesture} onChange={(d) => update({ ry: d / 2 })} />
        </>
      )}
      {(el.type === "line" || el.type === "arrow") && (
        <MeterField
          label="Length"
          meters={Math.hypot(el.x2 - el.x, el.y2 - el.y)}
          unit={unit}
          onStart={beginGesture}
          onEnd={endGesture}
          onChange={setLength}
        />
      )}
      {el.type !== "line" && el.type !== "arrow" && (
        <RotationField
          degrees={el.rotation}
          onStart={beginGesture}
          onEnd={endGesture}
          onChange={(rotation) => update({ rotation })}
        />
      )}
      {el.type === "door" && (
        <div className="flex items-center justify-between gap-2">
          <Label className="text-muted-foreground text-xs">Mirror</Label>
          <Toggle
            variant="outline"
            size="sm"
            pressed={el.flipX === true}
            onPressedChange={(on) => update({ flipX: on })}
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
            onFocus={beginGesture}
            onBlur={endGesture}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              if (Number.isInteger(v) && v >= 1 && v <= 50) update({ steps: v })
            }}
          />
        </div>
      )}
      {el.type === "line" && (
        <div className="flex items-center justify-between gap-2">
          <Label className="text-muted-foreground text-xs">End caps</Label>
          <Toggle
            variant="outline"
            size="sm"
            pressed={el.ticks === true}
            onPressedChange={(on) => update({ ticks: on })}
          >
            {el.ticks ? "On" : "Off"}
          </Toggle>
        </div>
      )}
    </div>
  )
}
