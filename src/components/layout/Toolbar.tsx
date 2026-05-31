import { type ComponentProps, useState, useRef, useEffect } from "react"
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
  ZoomIcon,
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

const MIN_ZOOM = 0.1
const MAX_ZOOM = 8
const LOG_MIN = Math.log(MIN_ZOOM)
const LOG_MAX = Math.log(MAX_ZOOM)

function zoomToSlider(z: number) {
  return ((Math.log(z) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100
}
function sliderToZoom(s: number) {
  return Math.exp(LOG_MIN + (s / 100) * (LOG_MAX - LOG_MIN))
}

export function Toolbar() {
  const tool = useEditor((s) => s.tool)
  const setTool = useEditor((s) => s.setTool)
  const settings = useEditor((s) => s.settings)
  const updateSettings = useEditor((s) => s.updateSettings)
  const elements = useEditor((s) => s.elements)
  const zoomToFit = useViewport((s) => s.zoomToFit)
  const zoom = useViewport((s) => s.zoom)
  const zoomAt = useViewport((s) => s.zoomAt)

  const [zoomOpen, setZoomOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!zoomOpen) return
    const handler = (e: MouseEvent) => {
      if (
        !panelRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setZoomOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [zoomOpen])

  const fit = () => {
    const vp = document
      .querySelector("[data-canvas-viewport]")
      ?.getBoundingClientRect()
    zoomToFit(combinedBox(elements), vp?.width ?? 800, vp?.height ?? 600)
  }

  const handleZoomSlider = (sliderVal: number) => {
    const target = sliderToZoom(sliderVal)
    const vp = document
      .querySelector("[data-canvas-viewport]")
      ?.getBoundingClientRect()
    const cx = vp ? vp.width / 2 : 400
    const cy = vp ? vp.height / 2 : 300
    zoomAt(target / zoom, cx, cy)
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

      <Separator className="my-1" />

      <div className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              ref={btnRef}
              size="icon"
              variant={zoomOpen ? "default" : "ghost"}
              onClick={() => setZoomOpen((v) => !v)}
              aria-label="Zoom level"
              className="flex flex-col gap-0 h-9"
            >
              <HugeiconsIcon icon={ZoomIcon} size={14} />
              <span className="text-[9px] font-mono leading-none">
                {Math.round(zoom * 100)}%
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Zoom level</TooltipContent>
        </Tooltip>

        {zoomOpen && (
          <div
            ref={panelRef}
            className="bg-card border rounded-lg shadow-lg p-3 flex flex-col items-center gap-2 select-none z-50"
            style={{ position: "absolute", left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" }}
          >
            <span className="text-[10px] text-muted-foreground font-mono">
              {Math.round(MAX_ZOOM * 100)}%
            </span>
            <div
              className="flex items-center justify-center"
              style={{ height: 140, width: 24 }}
            >
              <input
                type="range"
                min={0}
                max={100}
                step={0.5}
                value={zoomToSlider(zoom)}
                onChange={(e) => handleZoomSlider(Number(e.target.value))}
                style={{
                  width: 140,
                  transform: "rotate(-90deg)",
                  cursor: "pointer",
                }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              {Math.round(MIN_ZOOM * 100)}%
            </span>
            <span className="text-xs font-mono font-semibold">
              {Math.round(zoom * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
