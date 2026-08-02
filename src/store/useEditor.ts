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
  // Gesture bookkeeping: while a gesture is open, only its first mutation
  // records an undo entry.
  gesture: boolean
  gestureRecorded: boolean

  // selection / tool
  setTool: (tool: Tool) => void
  togglePanel: () => void
  toggleViewLock: () => void
  select: (id: string | null) => void
  setEditing: (id: string | null) => void

  // settings (not part of the undo history)
  updateSettings: (patch: Partial<Settings>) => void

  // history
  beginGesture: () => void
  endGesture: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // element CRUD â€” each of these records its own undo entry. Wrap a continuous
  // interaction (drag, resize, typing in a number field) in beginGesture() /
  // endGesture() to collapse it into a single step.
  addElement: (el: Element) => void
  updateElement: (id: string, patch: ElementPatch) => void
  removeElement: (id: string) => void
  bringForward: (id: string) => void
  sendBackward: (id: string) => void

  // bulk load (e.g. opening a project) â€” resets history
  loadProject: (elements: Element[], settings: Settings) => void
  reset: () => void
}

function nextZ(elements: Element[]): number {
  return elements.reduce((max, el) => Math.max(max, el.z), 0) + 1
}

export const useEditor = create<EditorState>((set, get) => {
  /**
   * Apply a document mutation, recording an undo entry first. Inside an open
   * gesture only the first mutation records one, so dragging a shape across the
   * canvas costs a single undo step instead of one per frame.
   */
  const mutate = (fn: (s: EditorState) => Partial<EditorState>) =>
    set((s) => ({
      ...(s.gesture && s.gestureRecorded
        ? null
        : {
            past: [...s.past, { elements: s.elements }].slice(-HISTORY_LIMIT),
            future: [],
          }),
      ...(s.gesture ? { gestureRecorded: true } : null),
      ...fn(s),
    }))

  return {
    elements: [],
    selectedId: null,
    editingId: null,
    tool: "select",
    settings: DEFAULT_SETTINGS,
    past: [],
    future: [],
    panelOpen: true,
    viewLock: false,
    gesture: false,
    gestureRecorded: false,

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
    select: (id) =>
      set((s) => ({ selectedId: id, editingId: id === s.editingId ? id : null })),
    setEditing: (id) => set({ editingId: id }),

    updateSettings: (patch) =>
      set((s) => ({ settings: { ...s.settings, ...patch } })),

    // Open a gesture. The next mutation records the pre-gesture state and the
    // rest fold into it. Unpaired calls are harmless: a gesture that never
    // mutates records nothing, and endGesture() simply closes whatever is open.
    beginGesture: () => set({ gesture: true, gestureRecorded: false }),
    endGesture: () => set({ gesture: false, gestureRecorded: false }),

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
          gesture: false,
          gestureRecorded: false,
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
          gesture: false,
          gestureRecorded: false,
        }
      }),

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,

    addElement: (el) =>
      mutate((s) => ({
        elements: [...s.elements, { ...el, z: nextZ(s.elements) }],
        selectedId: el.id,
      })),

    updateElement: (id, patch) =>
      mutate((s) => ({
        elements: s.elements.map((el) =>
          el.id === id ? ({ ...el, ...patch } as Element) : el,
        ),
      })),

    removeElement: (id) =>
      mutate((s) => ({
        elements: s.elements.filter((el) => el.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
        editingId: s.editingId === id ? null : s.editingId,
      })),

    bringForward: (id) =>
      mutate((s) => {
        const top = nextZ(s.elements)
        return {
          elements: s.elements.map((el) =>
            el.id === id ? { ...el, z: top } : el,
          ),
        }
      }),

    sendBackward: (id) =>
      mutate((s) => {
        const min = s.elements.reduce((m, el) => Math.min(m, el.z), Infinity)
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
        gesture: false,
        gestureRecorded: false,
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
        gesture: false,
        gestureRecorded: false,
      }),
  }
})
