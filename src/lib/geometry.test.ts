import { describe, expect, it } from "vitest"
import { combinedBox, elementBox, snap, uid } from "@/lib/geometry"
import type { Element } from "@/types/blueprint"

const base = {
  id: "x",
  rotation: 0,
  stroke: "#000",
  strokeWidth: 0.03,
  z: 1,
}

describe("snap", () => {
  it("rounds to the nearest multiple of the step", () => {
    expect(snap(0.13, 0.25)).toBe(0.25)
    expect(snap(0.12, 0.25)).toBe(0)
    expect(snap(1.6, 0.5)).toBe(1.5)
  })

  it("snaps negative values symmetrically", () => {
    expect(snap(-0.13, 0.25)).toBe(-0.25)
  })

  it("is a no-op when the step is zero or negative", () => {
    expect(snap(1.234, 0)).toBe(1.234)
    expect(snap(1.234, -1)).toBe(1.234)
  })
})

describe("elementBox", () => {
  it("uses width and height for box shapes", () => {
    const el = { ...base, type: "rectangle", x: 1, y: 2, w: 3, h: 4, fill: "none" } as Element
    expect(elementBox(el)).toEqual({ x: 1, y: 2, w: 3, h: 4 })
  })

  it("doubles the radii for an ellipse", () => {
    const el = { ...base, type: "ellipse", x: 1, y: 2, rx: 1.5, ry: 0.5, fill: "none" } as Element
    expect(elementBox(el)).toEqual({ x: 1, y: 2, w: 3, h: 1 })
  })

  it("normalises a line drawn right-to-left", () => {
    const el = { ...base, type: "line", x: 5, y: 8, x2: 1, y2: 2 } as Element
    expect(elementBox(el)).toEqual({ x: 1, y: 2, w: 4, h: 6 })
  })

  it("gives a zero-height box for a horizontal line", () => {
    const el = { ...base, type: "line", x: 0, y: 3, x2: 4, y2: 3 } as Element
    expect(elementBox(el)).toEqual({ x: 0, y: 3, w: 4, h: 0 })
  })
})

describe("combinedBox", () => {
  it("returns null when there is nothing to bound", () => {
    expect(combinedBox([])).toBeNull()
  })

  it("wraps every element, including negative coordinates", () => {
    const els = [
      { ...base, id: "a", type: "rectangle", x: -2, y: 0, w: 2, h: 2, fill: "none" },
      { ...base, id: "b", type: "rectangle", x: 4, y: 1, w: 1, h: 5, fill: "none" },
    ] as Element[]
    expect(combinedBox(els)).toEqual({ x: -2, y: 0, w: 7, h: 6 })
  })

  it("matches the single element's own box when there is one", () => {
    const el = { ...base, type: "rectangle", x: 1, y: 2, w: 3, h: 4, fill: "none" } as Element
    expect(combinedBox([el])).toEqual(elementBox(el))
  })
})

describe("uid", () => {
  it("does not collide across many calls", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => uid()))
    expect(ids.size).toBe(1000)
  })
})
