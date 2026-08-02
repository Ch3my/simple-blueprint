import { create } from "zustand"
import type { Element, ElementPatch, Settings, Tool } from "@/types/blueprint"
import { DEFAULT_SETTINGS } from "@/types/blueprint"

interface Snapshot {
  elements: Element[]
}

const HISTORY_LIMIT = 50

interface EditorState {
  elements: Element[]
  selectedId: string | null
  editingId: string | null
  tool: Tool
  settings: Settings
  past: Snapshot[]
  future: Snapshot[]
  panelOpen: boolean
  // View-only mode: shapes stop responding to pointers so the canvas can be
  // panned/zoomed (notably by touch) without dragging anything by accident.
  viewLock: boolean

  // selection / tool
  setTool: (tool: Tool) => void
  togglePanel: () => void
  toggleViewLock: () => void
  select: (id: string | null) => void
  setEditing: (id: string | null) => void

  // settings
  updateSettings: (patch: Partial<Settings>) => void

  // history
  pushHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // element CRUD (mutations do NOT snapshot; call pushHistory() first for undoable steps)
  addElement: (el: Element) => void
  updateElement: (id: string, patch: ElementPatch) => void
  removeElement: (id: string) => void
  bringForward: (id: string) => void
  sendBackward: (id: string) => void

  // bulk load (e.g. opening a project) — resets history
  loadProject: (elements: Element[], settings: Settings) => void
  reset: () => void
}

function nextZ(elements: Element[]): number {
  return elements.reduce((max, el) => Math.max(max, el.z), 0) + 1
}

export const useEditor = create<EditorState>((set, get) => ({
  elements: [],
  selectedId: null,
  editingId: null,
  tool: "select",
  settings: DEFAULT_SETTINGS,
  past: [],
  future: [],
  panelOpen: true,
  viewLock: false,

  setTool: (tool) => set({ tool }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  // Locking drops the current selection and returns to the select tool, so no
  // handles or half-finished draw prompts survive into view-only mode.
  toggleViewLock: () =>
    set((s) =>
      s.viewLock
        ? { viewLock: false }
        : { viewLock: true, tool: "select", selectedId: null, editingId: null },
    ),
  select: (id) => set((s) => ({ selectedId: id, editingId: id === s.editingId ? id : null })),
  setEditing: (id) => set({ editingId: id }),

  updateSettings: (patch) =>
    set((s) => ({ settings: { ...s.settings, ...patch } })),

  pushHistory: () =>
    set((s) => ({
      past: [...s.past, { elements: s.elements }].slice(-HISTORY_LIMIT),
      future: [],
    })),

  undo: () =>
    set((s) => {
      const prev = s.past[s.past.length - 1]
      if (!prev) return s
      return {
        elements: prev.elements,
        past: s.past.slice(0, -1),
        future: [{ elements: s.elements }, ...s.future].slice(0, HISTORY_LIMIT),
        selectedId: null,
        editingId: null,
      }
    }),

  redo: () =>
    set((s) => {
      const nextState = s.future[0]
      if (!nextState) return s
      return {
        elements: nextState.elements,
        past: [...s.past, { elements: s.elements }].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
        selectedId: null,
        editingId: null,
      }
    }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  addElement: (el) =>
    set((s) => ({
      elements: [...s.elements, { ...el, z: nextZ(s.elements) }],
      selectedId: el.id,
    })),

  updateElement: (id, patch) =>
    set((s) => ({
      elements: s.elements.map((el) =>
        el.id === id ? ({ ...el, ...patch } as Element) : el,
      ),
    })),

  removeElement: (id) =>
    set((s) => ({
      elements: s.elements.filter((el) => el.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      editingId: s.editingId === id ? null : s.editingId,
    })),

  bringForward: (id) =>
    set((s) => {
      const top = nextZ(s.elements)
      return {
        elements: s.elements.map((el) =>
          el.id === id ? { ...el, z: top } : el,
        ),
      }
    }),

  sendBackward: (id) =>
    set((s) => {
      const min = s.elements.reduce(
        (m, el) => Math.min(m, el.z),
        Infinity,
      )
      return {
        elements: s.elements.map((el) =>
          el.id === id ? { ...el, z: min - 1 } : el,
        ),
      }
    }),

  loadProject: (elements, settings) =>
    set({
      elements,
      settings,
      selectedId: null,
      editingId: null,
      past: [],
      future: [],
    }),

  reset: () =>
    set({
      elements: [],
      selectedId: null,
      editingId: null,
      tool: "select",
      settings: DEFAULT_SETTINGS,
      past: [],
      future: [],
      viewLock: false,
    }),
}))
