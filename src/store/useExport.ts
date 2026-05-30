import { create } from "zustand"

interface ExportState {
  active: boolean
  activate: () => void
  deactivate: () => void
}

export const useExport = create<ExportState>((set) => ({
  active: false,
  activate: () => set({ active: true }),
  deactivate: () => set({ active: false }),
}))
