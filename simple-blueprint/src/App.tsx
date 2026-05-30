import { useEffect } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Topbar } from "@/components/layout/Topbar"
import { Toolbar } from "@/components/layout/Toolbar"
import { PropertiesPanel } from "@/components/layout/PropertiesPanel"
import { Canvas } from "@/components/canvas/Canvas"
import { PrintView } from "@/components/canvas/PrintView"
import { ShapeSizeInput } from "@/components/ShapeSizeInput"
import { useProjects } from "@/store/useProjects"
import { useAutosave } from "@/hooks/useAutosave"
import { useKeyboard } from "@/hooks/useKeyboard"

function App() {
  const init = useProjects((s) => s.init)
  const loading = useProjects((s) => s.loading)

  useEffect(() => {
    void init()
  }, [init])

  useAutosave()
  useKeyboard()

  return (
    <TooltipProvider delayDuration={300}>
      <div className="screen-only flex h-screen flex-col overflow-hidden">
        <Topbar />
        <div className="flex flex-1 overflow-hidden">
          <Toolbar />
          <div className="relative flex-1 overflow-hidden">
            {!loading && <Canvas />}
            <ShapeSizeInput />
          </div>
          <PropertiesPanel />
        </div>
      </div>
      <PrintView />
    </TooltipProvider>
  )
}

export default App
