import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { LabelColor } from "@/types/blueprint"
import { LABEL_COLOR_OPTIONS, LABEL_POSITIONS, type SectionProps } from "./shared"

export function LabelSection({ el, update, beginGesture, endGesture }: SectionProps) {
  if (el.type === "text") return null

  return (
    <>
      <Separator />
      <div className="space-y-2">
        <p className="text-xs font-medium">Label</p>
        <Input
          type="text"
          placeholder="Add label…"
          className="h-8"
          value={el.label ?? ""}
          onFocus={beginGesture}
          onBlur={endGesture}
          onChange={(e) => update({ label: e.target.value })}
        />
        {el.label && (
          <>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-muted-foreground text-xs">Color</Label>
              <Select
                value={el.labelColor ?? "gray"}
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
            {el.type !== "line" && el.type !== "arrow" && (
              <div className="flex items-center justify-between gap-2">
                <Label className="text-muted-foreground text-xs">Position</Label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 3,
                    width: 57,
                  }}
                >
                  {LABEL_POSITIONS.map((pos) => (
                    <button
                      key={pos}
                      aria-label={pos}
                      onClick={() => update({ labelPosition: pos })}
                      style={{
                        width: 17,
                        height: 17,
                        borderRadius: 3,
                        border: "none",
                        cursor: "pointer",
                        background:
                          (el.labelPosition ?? "middle-center") === pos
                            ? "var(--primary)"
                            : "var(--muted)",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
