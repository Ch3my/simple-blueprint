import { describe, expect, it } from "vitest"
import {
  formatLength,
  fromDisplay,
  parseDims,
  round2,
  round4,
  toDisplay,
} from "@/lib/units"

describe("unit conversion", () => {
  it("treats meters as the canonical unit", () => {
    expect(toDisplay(2.5, "m")).toBe(2.5)
    expect(fromDisplay(2.5, "m")).toBe(2.5)
  })

  it("converts to and from centimetres", () => {
    expect(toDisplay(2.5, "cm")).toBe(250)
    expect(fromDisplay(250, "cm")).toBe(2.5)
  })

  it("round-trips a display value back to the same meters", () => {
    for (const meters of [0.01, 0.25, 1, 3.75, 120]) {
      expect(fromDisplay(toDisplay(meters, "cm"), "cm")).toBeCloseTo(meters, 10)
    }
  })

  it("formats a length with its unit", () => {
    expect(formatLength(2.5, "m")).toBe("2.5 m")
    expect(formatLength(2.5, "cm")).toBe("250 cm")
    // Rounds for display only; the stored value is untouched.
    expect(formatLength(1 / 3, "m")).toBe("0.33 m")
  })

  it("rounds without leaving floating point noise", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3)
    expect(round4(1.00005)).toBe(1.0001)
    expect(round4(2)).toBe(2)
  })
})

describe("parseDims", () => {
  it("reads a single dimension", () => {
    expect(parseDims("0.2")).toEqual({ a: 0.2, b: null })
  })

  it("reads two dimensions separated by x or *", () => {
    expect(parseDims("5x2")).toEqual({ a: 5, b: 2 })
    expect(parseDims("5 x 2")).toEqual({ a: 5, b: 2 })
    expect(parseDims("5*2")).toEqual({ a: 5, b: 2 })
    expect(parseDims("5X2")).toEqual({ a: 5, b: 2 })
  })

  it("accepts a comma as the decimal separator", () => {
    expect(parseDims("0,2")).toEqual({ a: 0.2, b: null })
    expect(parseDims("1,5x2,5")).toEqual({ a: 1.5, b: 2.5 })
  })

  it("ignores surrounding whitespace", () => {
    expect(parseDims("  3 ")).toEqual({ a: 3, b: null })
  })

  it("rejects input that is not a positive number", () => {
    expect(parseDims("")).toBeNull()
    expect(parseDims("   ")).toBeNull()
    expect(parseDims("abc")).toBeNull()
    expect(parseDims("0")).toBeNull()
    expect(parseDims("-5")).toBeNull()
    expect(parseDims("5x0")).toBeNull()
    expect(parseDims("5xabc")).toBeNull()
  })

  it("rejects more than two dimensions", () => {
    expect(parseDims("1x2x3")).toBeNull()
  })
})
