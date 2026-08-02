import { useEffect, useRef } from "react"
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
import { sanitizeHtml } from "@/lib/sanitize"
import type { LabelColor, TextElement } from "@/types/blueprint"
import { hexOr, FontSizeField, LABEL_COLOR_OPTIONS, type SectionProps } from "./fields"

/**
 * Editable mirror of the element's text. It edits the stored html directly
 * rather than a plain-text projection, so bold/underline on untouched text
 * survives edits made here.
 */
function TextContentField({
  html,
  onStart,
  onEnd,
  onChange,
}: {
  html: string
  onStart: () => void
  onEnd: () => void
  onChange: (html: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Load the stored html on mount and whenever it changes elsewhere (canvas
  // editing), but never while the caret is in here — that would move it.
  useEffect(() => {
    const node = ref.current
    if (!node || document.activeElement === node) return
    if (node.innerHTML !== html) node.innerHTML = html
  }, [html])

  return (
    <div
      ref={ref}
      role="textbox"
      aria-multiline="true"
      aria-label="Text content"
      contentEditable
      suppressContentEditableWarning
      className="min-h-16 w-full min-w-0 rounded-2xl border border-transparent bg-input/50 px-2.5 py-1.5 text-sm outline-none transition-[color,box-shadow] duration-200 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      onFocus={onStart}
      onBlur={onEnd}
      onInput={() => onChange(sanitizeHtml(ref.current?.innerHTML ?? ""))}
    />
  )
}

export function TextSection({ el, update, beginGesture, endGesture }: SectionProps) {
  if (el.type !== "text") return null
  const text = el as TextElement

  return (
    <>
      <Separator />
      <div className="space-y-2">
        <p className="text-xs font-medium">Text</p>
        <TextContentField
          key={text.id}
          html={text.html}
          onStart={beginGesture}
          onEnd={endGesture}
          onChange={(html) => update({ html })}
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
