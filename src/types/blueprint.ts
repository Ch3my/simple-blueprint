// Core data model for Simple Blueprint.
// CANONICAL UNIT IS METERS: every position/size field below is stored in meters.
// Display/parsing may use other units (see lib/units.ts), but storage is always meters.

export type Unit = "m" | "cm"

export type Tool = "select" | "rectangle" | "ellipse" | "line" | "arrow" | "text" | "door" | "stairs"

export type ElementType = "rectangle" | "ellipse" | "line" | "arrow" | "text" | "door" | "stairs"

interface BaseElement {
  id: string
  type: ElementType
  x: number // meters (top-left for box shapes; start point for line/arrow)
  y: number // meters
  rotation: number // degrees (box shapes only)
  stroke: string // CSS color
  strokeWidth: number // meters (physical thickness, scales with zoom/print)
  strokeStyle?: "solid" | "dashed" // contour style (default solid)
  z: number // stacking order
  locked?: boolean
  showLabel?: boolean // per-element dimension label visibility (default true)
  hatching?: boolean        // hatched fill with diagonal lines
  hatchSpacing?: number     // spacing between hatch lines in meters (default 0.1)
}

export interface RectElement extends BaseElement {
  type: "rectangle"
  w: number // meters
  h: number // meters
  fill: string // CSS color or "none"
}

export interface EllipseElement extends BaseElement {
  type: "ellipse"
  rx: number // meters (radius x)
  ry: number // meters (radius y)
  fill: string
}

export interface LineElement extends BaseElement {
  type: "line"
  x2: number // meters (end point)
  y2: number // meters
  ticks?: boolean // perpendicular end caps (e.g. dimension terminators)
}

export interface ArrowElement extends BaseElement {
  type: "arrow"
  x2: number // meters (end point)
  y2: number // meters
}

export interface DoorElement extends BaseElement {
  type: "door"
  w: number
  h: number
  flipX?: boolean
}

export interface StairsElement extends BaseElement {
  type: "stairs"
  w: number
  h: number
  steps: number
}

export type LabelColor = "gray" | "green" | "sky" | "purple" | "red"

export interface TextElement extends BaseElement {
  type: "text"
  w: number // meters
  h: number // meters
  html: string // sanitized rich text (b/u/i/br/div/span)
  fontSize: number // meters (cap height in world units)
  color: string // text color
  fill: string // background color or "none"
  labelMode?: boolean
  labelColor?: LabelColor
}

export type Element =
  | RectElement
  | EllipseElement
  | LineElement
  | ArrowElement
  | TextElement
  | DoorElement
  | StairsElement

// A partial patch that may touch any field of any element kind. (Partial<Element>
// would only expose the keys common to every variant, which is too narrow.)
// `type` is omitted from each variant before intersecting, otherwise the
// conflicting literal types ("rectangle" & "ellipse" = never) collapse it all.
export type ElementPatch = Partial<
  Omit<RectElement, "type"> &
    Omit<EllipseElement, "type"> &
    Omit<LineElement, "type"> &
    Omit<ArrowElement, "type"> &
    Omit<TextElement, "type"> &
    Omit<DoorElement, "type"> &
    Omit<StairsElement, "type">
>

export interface Settings {
  unit: Unit
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number // meters
  showDimensions: boolean
}

export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  elements: Element[]
  settings: Settings
}

export interface ProjectMeta {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export const DEFAULT_SETTINGS: Settings = {
  unit: "m",
  showGrid: true,
  snapToGrid: true,
  gridSize: 0.25,
  showDimensions: true,
}
