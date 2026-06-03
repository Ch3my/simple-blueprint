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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
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
import { useExport } from "@/store/useExport"
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
  ImageIcon,
  MoreIcon,
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

  const activateCrop = useExport((s) => s.activate)
  const onExportPNG = () => activateCrop()

  const onImport = async (file: File) => {
    try {
      const project = await importProjectFromFile(file)
      await importProject(project)
    } catch (err) {
      alert(`Could not import file: ${(err as Error).message}`)
    }
  }

  const themeLabel =
    theme === "light"
      ? "Switch to dark"
      : theme === "dark"
        ? "Switch to blueprint"
        : "Switch to light"
  const ThemeIcon =
    theme === "light" ? MoonIcon : theme === "dark" ? DropIcon : SunIcon

  return (
    <div className="bg-card flex h-12 items-center gap-1 border-b px-2 sm:gap-2 sm:px-3">
      {/* Brand — hidden on xs to save space */}
      <span className="font-heading hidden text-sm font-bold sm:inline">
        Simple Blueprint
      </span>
      <Separator orientation="vertical" className="mx-1 hidden sm:block" />

      {/* Projects */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setProjectsOpen(true)}
        aria-label="Projects"
        className="shrink-0 px-2 sm:px-3"
      >
        <HugeiconsIcon icon={FolderIcon} size={16} />
        <span className="hidden sm:inline">Projects</span>
      </Button>

      {/* Project name */}
      <Input
        value={currentName}
        onChange={(e) => void rename(e.target.value)}
        className="h-8 w-28 sm:w-48"
        aria-label="Project name"
      />

      <div className="flex-1" />

      {/* Undo / Redo — always visible */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            disabled={!canUndo}
            onClick={undo}
            aria-label="Undo"
          >
            <HugeiconsIcon icon={UndoIcon} size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            disabled={!canRedo}
            onClick={redo}
            aria-label="Redo"
          >
            <HugeiconsIcon icon={RedoIcon} size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
      </Tooltip>

      {/* --- Items hidden on small screens, shown inline on sm+ --- */}
      <Separator orientation="vertical" className="mx-1 hidden sm:block" />

      <Select
        value={unit}
        onValueChange={(v) => updateSettings({ unit: v as Unit })}
      >
        <SelectTrigger
          size="sm"
          className="hidden w-24 sm:flex"
          aria-label="Unit"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="m">Metros</SelectItem>
          <SelectItem value="cm">Centimetros</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="mx-1 hidden sm:block" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => void printProject()}
            aria-label="Print"
            className="hidden sm:inline-flex"
          >
            <HugeiconsIcon icon={PrinterIcon} size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Print</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => void onExport()}
            aria-label="Export JSON"
            className="hidden sm:inline-flex"
          >
            <HugeiconsIcon icon={DownloadIcon} size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export JSON</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={onExportPNG}
            aria-label="Export PNG"
            className="hidden sm:inline-flex"
          >
            <HugeiconsIcon icon={ImageIcon} size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export PNG</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileRef.current?.click()}
            aria-label="Import JSON"
            className="hidden sm:inline-flex"
          >
            <HugeiconsIcon icon={UploadIcon} size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Import JSON</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 hidden sm:block" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            aria-label="Cycle theme"
            className="hidden sm:inline-flex"
          >
            <HugeiconsIcon icon={ThemeIcon} size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{themeLabel}</TooltipContent>
      </Tooltip>

      {/* More menu — visible only on xs, collapses hidden items */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            aria-label="More options"
            className="sm:hidden"
          >
            <HugeiconsIcon icon={MoreIcon} size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Unit</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => updateSettings({ unit: "m" as Unit })} className={unit === "m" ? "font-semibold" : ""}>
            Metros
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateSettings({ unit: "cm" as Unit })} className={unit === "cm" ? "font-semibold" : ""}>
            Centimetros
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void printProject()}>
            <HugeiconsIcon icon={PrinterIcon} size={14} className="mr-2" />
            Print
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void onExport()}>
            <HugeiconsIcon icon={DownloadIcon} size={14} className="mr-2" />
            Export JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportPNG}>
            <HugeiconsIcon icon={ImageIcon} size={14} className="mr-2" />
            Export PNG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileRef.current?.click()}>
            <HugeiconsIcon icon={UploadIcon} size={14} className="mr-2" />
            Import JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={toggleTheme}>
            <HugeiconsIcon icon={ThemeIcon} size={14} className="mr-2" />
            {themeLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
          <Button
            size="icon"
            variant="ghost"
            onClick={togglePanel}
            aria-label="Toggle properties panel"
          >
            <HugeiconsIcon
              icon={panelOpen ? PanelCloseIcon : PanelOpenIcon}
              size={16}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {panelOpen ? "Hide properties" : "Show properties"}
        </TooltipContent>
      </Tooltip>

      <ProjectsDialog open={projectsOpen} onOpenChange={setProjectsOpen} />
    </div>
  )
}
