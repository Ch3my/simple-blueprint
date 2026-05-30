import { Label } from "@/components/ui/label"
import { Toggle } from "@/components/ui/toggle"
import { hexOr, MeterField, type SectionProps } from "./fields"

export function StrokeSection({ el, unit, edit, patch, pushHistory }: SectionProps) {
  return (
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
            onPressedChange={(on) => edit({ strokeStyle: on ? "dashed" : "solid" })}
          >
            {el.strokeStyle === "dashed" ? "Dashed" : "Solid"}
          </Toggle>
        </div>
      )}
    </div>
  )
}
