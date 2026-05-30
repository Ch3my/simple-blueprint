import { PX_PER_METER } from "@/lib/units"

const EXTENT = 20000 // px, large enough to cover panning in practice

/** Measured background grid, drawn inside the scaled world. */
export function GridLayer() {
  const fine = 0.25 * PX_PER_METER   // 25 cm
  const medium = 0.50 * PX_PER_METER  // 50 cm
  const major = PX_PER_METER           // 1 m

  return (
    <div
      data-export-hide
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
          `linear-gradient(to right, var(--grid-medium) 1px, transparent 1px)`,
          `linear-gradient(to bottom, var(--grid-medium) 1px, transparent 1px)`,
          `linear-gradient(to right, var(--grid-fine) 1px, transparent 1px)`,
          `linear-gradient(to bottom, var(--grid-fine) 1px, transparent 1px)`,
        ].join(","),
        backgroundSize: [
          `${major}px ${major}px`,
          `${major}px ${major}px`,
          `${medium}px ${medium}px`,
          `${medium}px ${medium}px`,
          `${fine}px ${fine}px`,
          `${fine}px ${fine}px`,
        ].join(","),
        backgroundPosition: `${EXTENT}px ${EXTENT}px`,
      }}
    />
  )
}
