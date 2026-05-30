import type { Project } from "@/types/blueprint"
import { DEFAULT_SETTINGS } from "@/types/blueprint"
import { uid } from "@/lib/geometry"
import { toPng } from "html-to-image"

/** Download the project as a .json file. */
export function exportProjectJSON(project: Project): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${project.name || "blueprint"}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Parse a JSON file into a Project, assigning a fresh id to avoid clobbering. */
export async function importProjectFromFile(file: File): Promise<Project> {
  const text = await file.text()
  const raw = JSON.parse(text) as Partial<Project>
  if (!Array.isArray(raw.elements)) {
    throw new Error("Invalid project file: missing elements array")
  }
  const now = Date.now()
  return {
    id: uid(),
    name: raw.name ? `${raw.name} (imported)` : "Imported project",
    createdAt: now,
    updatedAt: now,
    elements: raw.elements,
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) },
  }
}

/** Trigger the browser print dialog (PrintView handles the print layout). */
export function printProject(): void {
  window.print()
}

/** Screen-space rectangle (client coordinates) defining the crop region. */
export type ScreenCropRect = { x: number; y: number; w: number; h: number }

const PIXEL_RATIO = 3

/**
 * Capture the canvas viewport as a high-resolution PNG in light mode.
 * Pass a screen-space cropRect to export only a sub-region.
 * The caller is responsible for showing an opaque mask before calling so
 * the brief dark→light→dark class toggle is hidden from the user.
 */
export async function exportProjectPNG(
  projectName: string,
  cropRect?: ScreenCropRect,
): Promise<void> {
  const viewport = document.querySelector<HTMLElement>("[data-canvas-viewport]")
  if (!viewport) return

  const html = document.documentElement
  const wasDark = html.classList.contains("dark")
  const wasBlue = html.classList.contains("blue")
  html.classList.remove("dark", "blue")

  try {
    let dataUrl = await toPng(viewport, {
      pixelRatio: PIXEL_RATIO,
      cacheBust: true,
      backgroundColor: "#ffffff",
      filter: (node) =>
        !(node instanceof HTMLElement && node.hasAttribute("data-export-hide")),
    })

    if (cropRect) {
      const vp = viewport.getBoundingClientRect()
      // Clamp crop rect to the viewport bounds
      const x1 = Math.max(cropRect.x, vp.left)
      const y1 = Math.max(cropRect.y, vp.top)
      const x2 = Math.min(cropRect.x + cropRect.w, vp.right)
      const y2 = Math.min(cropRect.y + cropRect.h, vp.bottom)
      if (x2 > x1 && y2 > y1) {
        dataUrl = await cropImage(
          dataUrl,
          { x: x1 - vp.left, y: y1 - vp.top, w: x2 - x1, h: y2 - y1 },
          PIXEL_RATIO,
        )
      }
    }

    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `${projectName || "blueprint"}.png`
    a.click()
  } finally {
    if (wasDark) html.classList.add("dark")
    if (wasBlue) html.classList.add("blue")
  }
}

async function cropImage(
  dataUrl: string,
  rect: { x: number; y: number; w: number; h: number },
  pixelRatio: number,
): Promise<string> {
  const img = new Image()
  img.src = dataUrl
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
  })
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(rect.w * pixelRatio)
  canvas.height = Math.round(rect.h * pixelRatio)
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(
    img,
    Math.round(rect.x * pixelRatio),
    Math.round(rect.y * pixelRatio),
    Math.round(rect.w * pixelRatio),
    Math.round(rect.h * pixelRatio),
    0, 0,
    canvas.width,
    canvas.height,
  )
  return canvas.toDataURL("image/png")
}
