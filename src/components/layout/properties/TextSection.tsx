import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RichTextToolbar } from "@/components/RichTextToolbar"
import type { LabelColor, TextElement } from "@/types/blueprint"
import { hexOr, FontSizeField, LABEL_COLOR_OPTIONS, type SectionProps } from "./fields"

export function TextSection({ el, edit, patch, pushHistory }: SectionProps) {
  if (el.type !== "text") return null
  const text = el as TextElement

  return (
    <>
      <Separator />
      <div className="space-y-2">
        <p className="text-xs font-medium">Text</p>
        <RichTextToolbar el={text} />
        <div className="flex items-center justify-between gap-2">
          <Label className="text-muted-foreground text-xs">Color</Label>
          <input
            type="color"
            className="h-8 w-10 cursor-pointer rounded border"
            value={hexOr(text.color)}
            onChange={(e) => edit({ color: e.target.value })}
          />
        </div>
        <FontSizeField
          meters={text.fontSize}
          onStart={pushHistory}
          onChange={(fontSize) => patch({ fontSize })}
        />
        <div className="flex items-center justify-between gap-2">
          <Label className="text-muted-foreground text-xs">Label</Label>
          <Toggle
            variant="outline"
            size="sm"
            pressed={text.labelMode === true}
            onPressedChange={(on) => edit({ labelMode: on })}
          >
            {text.labelMode ? "On" : "Off"}
          </Toggle>
        </div>
        {text.labelMode && (
          <div className="flex items-center justify-between gap-2">
            <Label className="text-muted-foreground text-xs">Color</Label>
            <Select
              value={text.labelColor ?? "gray"}
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
  )
}
