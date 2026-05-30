import { useEffect } from "react"
import { useEditor } from "@/store/useEditor"
import { useProjects } from "@/store/useProjects"

/** Debounced autosave: persists the current project when elements/settings change. */
export function useAutosave(delay = 800) {
  const currentId = useProjects((s) => s.currentId)

  useEffect(() => {
    if (!currentId) return
    let timer: ReturnType<typeof setTimeout> | undefined

    const unsub = useEditor.subscribe((state, prev) => {
      if (state.elements === prev.elements && state.settings === prev.settings) {
        return
      }
      clearTimeout(timer)
      timer = setTimeout(() => {
        void useProjects.getState().saveCurrent()
      }, delay)
    })

    return () => {
      unsub()
      clearTimeout(timer)
    }
  }, [currentId, delay])
}
