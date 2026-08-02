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
import { htmlToText, textToHtml } from "@/lib/sanitize"
import type { LabelColor, TextElement } from "@/types/blueprint"
import { hexOr, FontSizeField, LABEL_COLOR_OPTIONS, type SectionProps } from "./fields"

export function TextSection({ el, update, beginGesture, endGesture }: SectionProps) {
  if (el.type !== "text") return null
  const text = el as TextElement

  return (
    <>
      <Separator />
      <div className="space-y-2">
        <p className="text-xs font-medium">Text</p>
        <textarea
          aria-label="Text content"
          placeholder="Type text…"
          rows={3}
          className="w-full min-w-0 resize-y rounded-2xl border border-transparent bg-input/50 px-2.5 py-1.5 text-sm outline-none transition-[color,box-shadow] duration-200 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          value={htmlToText(text.html)}
          onFocus={beginGesture}
          onBlur={endGesture}
          onChange={(e) => update({ html: textToHtml(e.target.value) })}
        />
        <RichTextToolbar el={text} />
        <div className="flex items-center justify-between gap-2">
          <Label className="text-muted-foreground text-xs">Color</Label>
          <input
            type="color"
            className="h-8 w-10 cursor-pointer rounded border"
            value={hexOr(text.color)}
            onChange={(e) => update({ color: e.target.value })}
          />
        </div>
        <FontSizeField
          meters={text.fontSize}
          onStart={beginGesture}
          onEnd={endGesture}
          onChange={(fontSize) => update({ fontSize })}
        />
        <div className="flex items-center justify-between gap-2">
          <Label className="text-muted-foreground text-xs">Label</Label>
          <Toggle
            variant="outline"
            size="sm"
            pressed={text.labelMode === true}
            onPressedChange={(on) => update({ labelMode: on })}
          >
            {text.labelMode ? "On" : "Off"}
          </Toggle>
        </div>
        {text.labelMode && (
          <div className="flex items-center justify-between gap-2">
            <Label className="text-muted-foreground text-xs">Color</Label>
            <Select
              value={text.labelColor ?? "gray"}
              onValueChange={(v) => update({ labelColor: v as LabelColor })}
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
