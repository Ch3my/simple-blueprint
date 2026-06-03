import { create } from "zustand"

interface ExportState {
  active: boolean
  activate: () => void
  deactivate: () => void
  capturing: boolean
  setCapturing: (v: boolean) => void
  printing: boolean
  setPrinting: (v: boolean) => void
}

export const useExport = create<ExportState>((set) => ({
  active: false,
  activate: () => set({ active: true }),
  deactivate: () => set({ active: false }),
  capturing: false,
  setCapturing: (v) => set({ capturing: v }),
  printing: false,
  setPrinting: (v) => set({ printing: v }),
}))
