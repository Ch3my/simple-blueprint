import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"
import { MeterField } from "./fields"
import { hexOr, type SectionProps } from "./shared"

export function FillSection({ el, unit, update, beginGesture, endGesture }: SectionProps) {
  const hasFill = el.type === "rectangle" || el.type === "ellipse" || el.type === "text"
  if (!hasFill) return null

  const hasHatching = el.type === "rectangle" || el.type === "ellipse"

  return (
    <>
      <Separator />
      <div className="space-y-2">
        <p className="text-xs font-medium">{el.type === "text" ? "Background" : "Fill"}</p>
        {hasHatching && (
          <>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-muted-foreground text-xs">Hatch</Label>
              <Toggle
                variant="outline"
                size="sm"
                pressed={el.hatching === true}
                onPressedChange={(on) => update({ hatching: on })}
              >
                {el.hatching ? "On" : "Off"}
              </Toggle>
            </div>
            {el.hatching && (
              <MeterField
                label="Spacing"
                meters={el.hatchSpacing ?? 0.1}
                unit={unit}
                onStart={beginGesture}
                onEnd={endGesture}
                onChange={(hatchSpacing) => update({ hatchSpacing })}
              />
            )}
          </>
        )}
        <div className="flex items-center justify-between gap-2">
          <Toggle
            variant="outline"
            size="sm"
            pressed={el.fill !== "none"}
            onPressedChange={(on) => update({ fill: on ? "#dbeafe" : "none" })}
          >
            {el.fill !== "none" ? "Filled" : "No fill"}
          </Toggle>
          {el.fill !== "none" && (
            <input
              type="color"
              className="h-8 w-10 cursor-pointer rounded border"
              value={hexOr(el.fill, "#dbeafe")}
              onChange={(e) => update({ fill: e.target.value })}
            />
          )}
        </div>
      </div>
    </>
  )
}
