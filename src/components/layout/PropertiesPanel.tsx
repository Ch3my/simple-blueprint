import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useEditor } from "@/store/useEditor"
import type { ElementPatch } from "@/types/blueprint"
import {
  HugeiconsIcon,
  DeleteIcon,
  BringForwardIcon,
  SendBackwardIcon,
} from "@/components/icons"
import { DimensionsSection } from "./properties/DimensionsSection"
import { LabelSection } from "./properties/LabelSection"
import { StrokeSection } from "./properties/StrokeSection"
import { FillSection } from "./properties/FillSection"
import { TextSection } from "./properties/TextSection"

export function PropertiesPanel() {
  const selectedId = useEditor((s) => s.selectedId)
  const el = useEditor((s) => s.elements.find((e) => e.id === selectedId))
  const unit = useEditor((s) => s.settings.unit)
  const update = useEditor((s) => s.updateElement)
  const pushHistory = useEditor((s) => s.pushHistory)
  const removeElement = useEditor((s) => s.removeElement)
  const bringForward = useEditor((s) => s.bringForward)
  const sendBackward = useEditor((s) => s.sendBackward)

  if (!el) {
    return (
      <div className="bg-card text-muted-foreground h-full w-64 border-l p-4 text-sm">
        Selecciona un elemento para editar sus propiedades, o elige una herramienta de forma para añadir uno.
      </div>
    )
  }

  const edit = (p: ElementPatch) => { pushHistory(); update(el.id, p) }
  const patch = (p: ElementPatch) => update(el.id, p)
  const sectionProps = { el, unit, edit, patch, pushHistory }

  return (
    <div className="bg-card h-full w-64 space-y-4 overflow-y-auto border-l p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-heading text-sm font-semibold capitalize">{el.type}</span>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Delete"
          onClick={() => { pushHistory(); removeElement(el.id) }}
        >
          <HugeiconsIcon icon={DeleteIcon} size={16} />
        </Button>
      </div>

      <Separator />

      <DimensionsSection {...sectionProps} />
      <LabelSection {...sectionProps} />

      <Separator />

      <StrokeSection {...sectionProps} />
      <FillSection {...sectionProps} />
      <TextSection {...sectionProps} />

      <Separator />

      {/* Order */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => { pushHistory(); bringForward(el.id) }}
        >
          <HugeiconsIcon icon={BringForwardIcon} size={14} /> Front
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => { pushHistory(); sendBackward(el.id) }}
        >
          <HugeiconsIcon icon={SendBackwardIcon} size={14} /> Back
        </Button>
      </div>
    </div>
  )
}
