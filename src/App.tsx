import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Topbar } from "@/components/layout/Topbar"
import { Toolbar } from "@/components/layout/Toolbar"
import { PropertiesPanel } from "@/components/layout/PropertiesPanel"
import { Canvas } from "@/components/canvas/Canvas"
import { PrintView } from "@/components/canvas/PrintView"
import { ExportCropOverlay } from "@/components/ExportCropOverlay"
import { CaptureOverlay } from "@/components/CaptureOverlay"
import { ShapeSizeInput } from "@/components/ShapeSizeInput"
import { useEditor } from "@/store/useEditor"
import { useProjects } from "@/store/useProjects"
import { useAutosave } from "@/hooks/useAutosave"
import { useKeyboard } from "@/hooks/useKeyboard"

function App() {
  const init = useProjects((s) => s.init)
  const loading = useProjects((s) => s.loading)
  const panelOpen = useEditor((s) => s.panelOpen)

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
          <div className={cn("h-full overflow-hidden transition-[width] duration-200", panelOpen ? "w-64" : "w-0")}>
            <PropertiesPanel />
          </div>
        </div>
      </div>
      <PrintView />
      <ExportCropOverlay />
      <CaptureOverlay />
    </TooltipProvider>
  )
}

export default App
