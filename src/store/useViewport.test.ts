import { beforeEach, describe, expect, it } from "vitest"
import { screenToWorldMeters, useViewport } from "@/store/useViewport"
import { PX_PER_METER } from "@/lib/units"

const MIN_ZOOM = 0.1
const MAX_ZOOM = 8

/** Where a world point currently lands on screen. */
function worldToScreen(mx: number, my: number) {
  const { panX, panY, zoom } = useViewport.getState()
  return {
    sx: mx * PX_PER_METER * zoom + panX,
    sy: my * PX_PER_METER * zoom + panY,
  }
}

beforeEach(() => {
  useViewport.getState().reset()
})

describe("panBy", () => {
  it("accumulates screen-pixel deltas", () => {
    useViewport.getState().panBy(10, -5)
    useViewport.getState().panBy(2, 2)
    const { panX, panY } = useViewport.getState()
    expect(panX).toBe(92) // starts at 80
    expect(panY).toBe(77)
  })
})

describe("zoomAt", () => {
  it("keeps the world point under the cursor stationary", () => {
    // Whatever is under (300, 200) must still be under it after zooming.
    const before = screenToWorldMeters(300, 200, useViewport.getState())
    useViewport.getState().zoomAt(2, 300, 200)
    const after = screenToWorldMeters(300, 200, useViewport.getState())
    expect(after.mx).toBeCloseTo(before.mx, 10)
    expect(after.my).toBeCloseTo(before.my, 10)
  })

  it("holds the anchor across a sequence of zooms in both directions", () => {
    const anchor = screenToWorldMeters(120, 640, useViewport.getState())
    for (const factor of [1.1, 1.1, 0.9, 1.1, 0.9, 0.9]) {
      useViewport.getState().zoomAt(factor, 120, 640)
    }
    const after = screenToWorldMeters(120, 640, useViewport.getState())
    expect(after.mx).toBeCloseTo(anchor.mx, 8)
    expect(after.my).toBeCloseTo(anchor.my, 8)
  })

  it("multiplies the existing zoom", () => {
    useViewport.getState().zoomAt(2, 0, 0)
    expect(useViewport.getState().zoom).toBeCloseTo(2, 10)
    useViewport.getState().zoomAt(1.5, 0, 0)
    expect(useViewport.getState().zoom).toBeCloseTo(3, 10)
  })

  it("clamps at both ends instead of running away", () => {
    useViewport.getState().zoomAt(1000, 0, 0)
    expect(useViewport.getState().zoom).toBe(MAX_ZOOM)
    useViewport.getState().zoomAt(0.00001, 0, 0)
    expect(useViewport.getState().zoom).toBe(MIN_ZOOM)
  })
})

describe("zoomToFit", () => {
  it("falls back to the default view when there is nothing to fit", () => {
    useViewport.getState().panBy(500, 500)
    useViewport.getState().zoomToFit(null, 800, 600)
    expect(useViewport.getState()).toMatchObject({ panX: 80, panY: 80, zoom: 1 })
  })

  it("ignores a degenerate box rather than dividing by zero", () => {
    useViewport.getState().zoomToFit({ x: 0, y: 0, w: 0, h: 0 }, 800, 600)
    expect(useViewport.getState().zoom).toBe(1)
    expect(Number.isFinite(useViewport.getState().panX)).toBe(true)
  })

  it("centres the box in the viewport", () => {
    const box = { x: 2, y: 1, w: 4, h: 3 }
    useViewport.getState().zoomToFit(box, 800, 600)

    const centre = worldToScreen(box.x + box.w / 2, box.y + box.h / 2)
    expect(centre.sx).toBeCloseTo(400, 6)
    expect(centre.sy).toBeCloseTo(300, 6)
  })

  it("fits the box inside the viewport with padding to spare", () => {
    const box = { x: -3, y: 5, w: 12, h: 2 }
    useViewport.getState().zoomToFit(box, 800, 600)

    const topLeft = worldToScreen(box.x, box.y)
    const bottomRight = worldToScreen(box.x + box.w, box.y + box.h)
    expect(topLeft.sx).toBeGreaterThanOrEqual(0)
    expect(topLeft.sy).toBeGreaterThanOrEqual(0)
    expect(bottomRight.sx).toBeLessThanOrEqual(800)
    expect(bottomRight.sy).toBeLessThanOrEqual(600)
  })

  it("does not zoom past the maximum for a tiny box", () => {
    useViewport.getState().zoomToFit({ x: 0, y: 0, w: 0.001, h: 0.001 }, 800, 600)
    expect(useViewport.getState().zoom).toBeLessThanOrEqual(MAX_ZOOM)
  })
})

describe("screenToWorldMeters", () => {
  it("inverts the world-to-screen transform", () => {
    useViewport.getState().zoomAt(1.7, 200, 150)
    const { sx, sy } = worldToScreen(3.25, -1.5)
    const back = screenToWorldMeters(sx, sy, useViewport.getState())
    expect(back.mx).toBeCloseTo(3.25, 10)
    expect(back.my).toBeCloseTo(-1.5, 10)
  })
})
