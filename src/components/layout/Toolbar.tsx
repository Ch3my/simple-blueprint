import type { ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useEditor } from "@/store/useEditor"
import { useViewport } from "@/store/useViewport"
import { combinedBox } from "@/lib/geometry"
import type { Tool } from "@/types/blueprint"
import {
  HugeiconsIcon,
  CursorIcon,
  DoorIcon,
  RectIcon,
  CircleIcon,
  LineIcon,
  ArrowIcon,
  StairsIcon,
  TextIcon,
  GridIcon,
  MagnetIcon,
  RulerIcon,
  FitIcon,
} from "@/components/icons"

type IconDef = ComponentProps<typeof HugeiconsIcon>["icon"]

const TOOLS: { tool: Tool; icon: IconDef; label: string }[] = [
  { tool: "select", icon: CursorIcon, label: "Select (V)" },
  { tool: "rectangle", icon: RectIcon, label: "Rectangle (R)" },
  { tool: "ellipse", icon: CircleIcon, label: "Circle / Ellipse (C)" },
  { tool: "line", icon: LineIcon, label: "Line (L)" },
  { tool: "arrow", icon: ArrowIcon, label: "Arrow (A)" },
  { tool: "text", icon: TextIcon, label: "Text (T)" },
  { tool: "door", icon: DoorIcon, label: "Door (D)" },
  { tool: "stairs", icon: StairsIcon, label: "Stairs (S)" },
]

function IconButton({
  active,
  label,
  icon,
  onClick,
}: {
  active?: boolean
  label: string
  icon: IconDef
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant={active ? "default" : "ghost"}
          onClick={onClick}
          aria-label={label}
        >
          <HugeiconsIcon icon={icon} size={18} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

export function Toolbar() {
  const tool = useEditor((s) => s.tool)
  const setTool = useEditor((s) => s.setTool)
  const settings = useEditor((s) => s.settings)
  const updateSettings = useEditor((s) => s.updateSettings)
  const elements = useEditor((s) => s.elements)
  const zoomToFit = useViewport((s) => s.zoomToFit)

  const fit = () => {
    const vp = document
      .querySelector("[data-canvas-viewport]")
      ?.getBoundingClientRect()
    zoomToFit(combinedBox(elements), vp?.width ?? 800, vp?.height ?? 600)
  }

  return (
    <div className="bg-card flex w-12 flex-col items-center gap-1 border-r py-2">
      {TOOLS.map((t) => (
        <IconButton
          key={t.tool}
          active={tool === t.tool}
          label={t.label}
          icon={t.icon}
          onClick={() => setTool(t.tool)}
        />
      ))}

      <Separator className="my-1" />

      <IconButton
        active={settings.showGrid}
        label="Toggle grid"
        icon={GridIcon}
        onClick={() => updateSettings({ showGrid: !settings.showGrid })}
      />
      <IconButton
        active={settings.snapToGrid}
        label="Snap to grid"
        icon={MagnetIcon}
        onClick={() => updateSettings({ snapToGrid: !settings.snapToGrid })}
      />
      <IconButton
        active={settings.showDimensions}
        label="Toggle dimensions"
        icon={RulerIcon}
        onClick={() =>
          updateSettings({ showDimensions: !settings.showDimensions })
        }
      />

      <Separator className="my-1" />

      <IconButton label="Zoom to fit" icon={FitIcon} onClick={fit} />
    </div>
  )
}
