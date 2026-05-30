import type { Unit } from "@/types/blueprint"

// Fixed mapping from world meters to layout pixels (before zoom).
export const PX_PER_METER = 100

export function metersToPx(m: number): number {
  return m * PX_PER_METER
}

export function pxToMeters(px: number): number {
  return px / PX_PER_METER
}

const UNIT_FACTOR: Record<Unit, number> = { m: 1, cm: 100 }

/** Convert a canonical meter value to a display value in the given unit. */
export function toDisplay(meters: number, unit: Unit): number {
  return meters * UNIT_FACTOR[unit]
}

/** Convert a user-entered display value (in `unit`) back to canonical meters. */
export function fromDisplay(value: number, unit: Unit): number {
  return value / UNIT_FACTOR[unit]
}

/** Round to at most 2 decimals, dropping trailing zeros. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Round to at most 4 decimals, dropping trailing zeros. */
export function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}

/** Human label for a length, e.g. "5 m" or "20 cm". */
export function formatLength(meters: number, unit: Unit): string {
  return `${round2(toDisplay(meters, unit))} ${unit}`
}

/**
 * Parse a dimension string into one or two positive numbers (in display units).
 * Accepts "5x2", "5 x 2", "5*2", "5X2", single "0.2". Comma is treated as a
 * decimal separator ("0,2" -> 0.2). Returns null if invalid.
 */
export function parseDims(input: string): { a: number; b: number | null } | null {
  const cleaned = input.trim().toLowerCase().replace(/,/g, ".")
  if (!cleaned) return null
  const parts = cleaned.split(/\s*[x*]\s*/).filter((p) => p.length > 0)
  if (parts.length < 1 || parts.length > 2) return null
  const nums = parts.map((p) => Number(p))
  if (nums.some((n) => !Number.isFinite(n) || n <= 0)) return null
  return { a: nums[0], b: nums.length === 2 ? nums[1] : null }
}
