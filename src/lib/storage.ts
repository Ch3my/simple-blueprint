import { get, set, del, createStore } from "idb-keyval"
import type { Project, ProjectMeta, Settings } from "@/types/blueprint"
import { DEFAULT_SETTINGS } from "@/types/blueprint"
import { uid } from "@/lib/geometry"

// One IndexedDB record per project (key = project id) plus a lightweight index
// listing metadata, so the projects list loads without reading every project.
const store = createStore("simple-blueprint", "projects")
const INDEX_KEY = "__index__"

function toMeta(p: Project): ProjectMeta {
  return { id: p.id, name: p.name, createdAt: p.createdAt, updatedAt: p.updatedAt }
}

export async function listProjects(): Promise<ProjectMeta[]> {
  const index = (await get<ProjectMeta[]>(INDEX_KEY, store)) ?? []
  return index.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function loadProject(id: string): Promise<Project | undefined> {
  return get<Project>(id, store)
}

export async function saveProject(project: Project): Promise<void> {
  const updated: Project = { ...project, updatedAt: Date.now() }
  await set(updated.id, updated, store)
  const index = (await get<ProjectMeta[]>(INDEX_KEY, store)) ?? []
  const rest = index.filter((m) => m.id !== updated.id)
  await set(INDEX_KEY, [...rest, toMeta(updated)], store)
}

export async function deleteProject(id: string): Promise<void> {
  await del(id, store)
  const index = (await get<ProjectMeta[]>(INDEX_KEY, store)) ?? []
  await set(
    INDEX_KEY,
    index.filter((m) => m.id !== id),
    store,
  )
}

export async function renameProject(id: string, name: string): Promise<void> {
  const p = await loadProject(id)
  if (!p) return
  await saveProject({ ...p, name })
}

export function blankProject(name = "Untitled", settings?: Settings): Project {
  const now = Date.now()
  return {
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    elements: [],
    settings: settings ?? DEFAULT_SETTINGS,
  }
}
