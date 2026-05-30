import { useEditor } from "@/store/useEditor"
import { useViewport } from "@/store/useViewport"
import { usePanZoom } from "@/hooks/usePanZoom"
import { GridLayer } from "./GridLayer"
import { ElementRenderer } from "./ElementRenderer"
import { SelectionOverlay } from "./SelectionOverlay"
import { DimensionLabels } from "./DimensionLabels"

export function Canvas() {
  const elements = useEditor((s) => s.elements)
  const settings = useEditor((s) => s.settings)
  const select = useEditor((s) => s.select)
  const setEditing = useEditor((s) => s.setEditing)
  const { panX, panY, zoom } = useViewport()
  const { viewportRef, bindWheel, bindPan } = usePanZoom()

  return (
    <div
      ref={viewportRef}
      className="relative h-full w-full overflow-hidden bg-background"
      data-canvas-viewport
      {...bindWheel()}
    >
      {/* Background surface: pans on drag, deselects on click */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 0, touchAction: "none", cursor: "grab" }}
        {...bindPan()}
        onPointerDown={() => {
          select(null)
          setEditing(null)
        }}
      />

      {/* Scaled world */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: "0 0",
          pointerEvents: "none",
          color: "var(--foreground)",
        }}
      >
        {settings.showGrid && <GridLayer gridSize={settings.gridSize} />}
        {elements.map((el) => (
          <ElementRenderer key={el.id} el={el} />
        ))}
      </div>

      {/* Screen-space overlays */}
      <SelectionOverlay />
      {settings.showDimensions && <DimensionLabels />}
    </div>
  )
}
