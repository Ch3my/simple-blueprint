import { PX_PER_METER } from "@/lib/units"
import { combinedBox } from "@/lib/geometry"
import { useEditor } from "@/store/useEditor"
import { ElementRenderer } from "./ElementRenderer"

const MAX_PRINT_PX = 1000 // fit the plan within this width/height on paper

/** Print-only rendering of the plan, scaled to fit the page. */
export function PrintView() {
  const elements = useEditor((s) => s.elements)
  const box = combinedBox(elements)
  if (!box || box.w <= 0 || box.h <= 0) return null

  const pad = 0.2 // meters of padding around the plan
  const w = (box.w + pad * 2) * PX_PER_METER
  const h = (box.h + pad * 2) * PX_PER_METER
  const scale = Math.min(1, MAX_PRINT_PX / w, MAX_PRINT_PX / h)

  return (
    <div className="print-only">
      <div
        style={{
          position: "relative",
          width: w * scale,
          height: h * scale,
          color: "#111",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: "0 0",
            transform: `scale(${scale}) translate(${(-box.x + pad) * PX_PER_METER}px, ${(-box.y + pad) * PX_PER_METER}px)`,
          }}
        >
          {elements.map((el) => (
            <ElementRenderer key={el.id} el={el} />
          ))}
        </div>
      </div>
    </div>
  )
}
