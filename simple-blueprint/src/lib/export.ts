import type { Project } from "@/types/blueprint"
import { DEFAULT_SETTINGS } from "@/types/blueprint"
import { uid } from "@/lib/geometry"

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
