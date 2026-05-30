import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { useEditor } from "@/store/useEditor"
import { useProjects } from "@/store/useProjects"
import { useTheme } from "@/store/useTheme"
import type { Unit } from "@/types/blueprint"
import {
  exportProjectJSON,
  importProjectFromFile,
  printProject,
} from "@/lib/export"
import { loadProject } from "@/lib/storage"
import { ProjectsDialog } from "@/components/dialogs/ProjectsDialog"
import {
  HugeiconsIcon,
  FolderIcon,
  UndoIcon,
  RedoIcon,
  PrinterIcon,
  DownloadIcon,
  UploadIcon,
  SunIcon,
  MoonIcon,
  DropIcon,
  PanelOpenIcon,
  PanelCloseIcon,
} from "@/components/icons"

export function Topbar() {
  const undo = useEditor((s) => s.undo)
  const redo = useEditor((s) => s.redo)
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const unit = useEditor((s) => s.settings.unit)
  const updateSettings = useEditor((s) => s.updateSettings)

  const currentName = useProjects((s) => s.currentName)
  const currentId = useProjects((s) => s.currentId)
  const rename = useProjects((s) => s.rename)
  const importProject = useProjects((s) => s.importProject)

  const panelOpen = useEditor((s) => s.panelOpen)
  const togglePanel = useEditor((s) => s.togglePanel)

  const theme = useTheme((s) => s.theme)
  const toggleTheme = useTheme((s) => s.toggle)

  const [projectsOpen, setProjectsOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onExport = async () => {
    if (!currentId) return
    const p = await loadProject(currentId)
    if (p) exportProjectJSON({ ...p, name: currentName })
  }

  const onImport = async (file: File) => {
    try {
      const project = await importProjectFromFile(file)
      await importProject(project)
    } catch (err) {
      alert(`Could not import file: ${(err as Error).message}`)
    }
  }

  return (
    <div className="bg-card flex h-12 items-center gap-2 border-b px-3">
      <span className="font-heading text-sm font-bold">Simple Blueprint</span>

      <Separator orientation="vertical" className="mx-1" />

      <Button
        size="sm"
        variant="ghost"
        onClick={() => setProjectsOpen(true)}
        aria-label="Projects"
      >
        <HugeiconsIcon icon={FolderIcon} size={16} /> Projects
      </Button>

      <Input
        value={currentName}
        onChange={(e) => void rename(e.target.value)}
        className="h-8 w-48"
        aria-label="Project name"
      />

      <div className="flex-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" disabled={!canUndo} onClick={undo} aria-label="Undo">
            <HugeiconsIcon icon={UndoIcon} size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" disabled={!canRedo} onClick={redo} aria-label="Redo">
            <HugeiconsIcon icon={RedoIcon} size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1" />

      <Select value={unit} onValueChange={(v) => updateSettings({ unit: v as Unit })}>
        <SelectTrigger size="sm" className="w-24" aria-label="Unit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="m">meters</SelectItem>
          <SelectItem value="cm">cm</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="mx-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => printProject()} aria-label="Print">
            <HugeiconsIcon icon={PrinterIcon} size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Print</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => void onExport()} aria-label="Export JSON">
            <HugeiconsIcon icon={DownloadIcon} size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export JSON</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => fileRef.current?.click()} aria-label="Import JSON">
            <HugeiconsIcon icon={UploadIcon} size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Import JSON</TooltipContent>
      </Tooltip>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void onImport(f)
          e.target.value = ""
        }}
      />
      <Separator orientation="vertical" className="mx-1" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label="Cycle theme">
            <HugeiconsIcon
              icon={theme === "light" ? MoonIcon : theme === "dark" ? DropIcon : SunIcon}
              size={16}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {theme === "light" ? "Switch to dark" : theme === "dark" ? "Switch to blueprint" : "Switch to light"}
        </TooltipContent>
      </Tooltip>
      <Separator orientation="vertical" className="mx-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={togglePanel} aria-label="Toggle properties panel">
            <HugeiconsIcon icon={panelOpen ? PanelCloseIcon : PanelOpenIcon} size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{panelOpen ? "Hide properties" : "Show properties"}</TooltipContent>
      </Tooltip>
      <ProjectsDialog open={projectsOpen} onOpenChange={setProjectsOpen} />
    </div>
  )
}
