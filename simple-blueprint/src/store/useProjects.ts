import { create } from "zustand"
import type { ProjectMeta, Project } from "@/types/blueprint"
import {
  blankProject,
  deleteProject,
  listProjects,
  loadProject,
  renameProject,
  saveProject,
} from "@/lib/storage"
import { useEditor } from "@/store/useEditor"

const LAST_KEY = "bp:lastProject"

interface ProjectsState {
  currentId: string | null
  currentName: string
  metas: ProjectMeta[]
  loading: boolean

  init: () => Promise<void>
  refreshList: () => Promise<void>
  newProject: () => Promise<void>
  open: (id: string) => Promise<void>
  saveCurrent: () => Promise<void>
  rename: (name: string) => Promise<void>
  remove: (id: string) => Promise<void>
  importProject: (project: Project) => Promise<void>
}

function applyToEditor(p: Project) {
  useEditor.getState().loadProject(p.elements, p.settings)
}

export const useProjects = create<ProjectsState>((set, get) => ({
  currentId: null,
  currentName: "Untitled",
  metas: [],
  loading: true,

  init: async () => {
    const metas = await listProjects()
    const last = localStorage.getItem(LAST_KEY)
    const target =
      (last && metas.find((m) => m.id === last)?.id) ?? metas[0]?.id ?? null
    if (target) {
      const p = await loadProject(target)
      if (p) {
        applyToEditor(p)
        set({ currentId: p.id, currentName: p.name, metas, loading: false })
        localStorage.setItem(LAST_KEY, p.id)
        return
      }
    }
    // No saved projects yet — create a fresh one.
    const p = blankProject()
    await saveProject(p)
    applyToEditor(p)
    localStorage.setItem(LAST_KEY, p.id)
    set({
      currentId: p.id,
      currentName: p.name,
      metas: await listProjects(),
      loading: false,
    })
  },

  refreshList: async () => set({ metas: await listProjects() }),

  newProject: async () => {
    const p = blankProject()
    await saveProject(p)
    applyToEditor(p)
    localStorage.setItem(LAST_KEY, p.id)
    set({ currentId: p.id, currentName: p.name, metas: await listProjects() })
  },

  open: async (id) => {
    const p = await loadProject(id)
    if (!p) return
    applyToEditor(p)
    localStorage.setItem(LAST_KEY, p.id)
    set({ currentId: p.id, currentName: p.name })
  },

  saveCurrent: async () => {
    const { currentId, currentName } = get()
    if (!currentId) return
    const editor = useEditor.getState()
    const existing = await loadProject(currentId)
    await saveProject({
      id: currentId,
      name: currentName,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      elements: editor.elements,
      settings: editor.settings,
    })
    await get().refreshList()
  },

  rename: async (name) => {
    const { currentId } = get()
    set({ currentName: name })
    if (currentId) {
      await renameProject(currentId, name)
      await get().refreshList()
    }
  },

  remove: async (id) => {
    await deleteProject(id)
    await get().refreshList()
    if (get().currentId === id) {
      const next = get().metas[0]
      if (next) await get().open(next.id)
      else await get().newProject()
    }
  },

  importProject: async (project) => {
    await saveProject(project)
    applyToEditor(project)
    localStorage.setItem(LAST_KEY, project.id)
    set({
      currentId: project.id,
      currentName: project.name,
      metas: await listProjects(),
    })
  },
}))
