import { PX_PER_METER } from "@/lib/units"

const EXTENT = 20000 // px, large enough to cover panning in practice

/** Measured background grid, drawn inside the scaled world. */
export function GridLayer({ gridSize }: { gridSize: number }) {
  const fine = Math.max(2, gridSize * PX_PER_METER)
  const major = PX_PER_METER // a line every 1 meter

  return (
    <div
      style={{
        position: "absolute",
        left: -EXTENT,
        top: -EXTENT,
        width: EXTENT * 2,
        height: EXTENT * 2,
        pointerEvents: "none",
        backgroundImage: [
          `linear-gradient(to right, var(--grid-major) 1px, transparent 1px)`,
          `linear-gradient(to bottom, var(--grid-major) 1px, transparent 1px)`,
          `linear-gradient(to right, var(--grid-fine) 1px, transparent 1px)`,
          `linear-gradient(to bottom, var(--grid-fine) 1px, transparent 1px)`,
        ].join(","),
        backgroundSize: `${major}px ${major}px, ${major}px ${major}px, ${fine}px ${fine}px, ${fine}px ${fine}px`,
        backgroundPosition: `${EXTENT}px ${EXTENT}px`,
      }}
    />
  )
}
