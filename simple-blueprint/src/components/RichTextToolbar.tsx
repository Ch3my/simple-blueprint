import { Button } from "@/components/ui/button"
import { HugeiconsIcon, BoldIcon, UnderlineIcon } from "@/components/icons"
import { useEditor } from "@/store/useEditor"
import type { TextElement } from "@/types/blueprint"

/**
 * Simple rich-text controls (bold / underline) for the selected text element.
 * Uses execCommand on the active contentEditable selection; commands apply only
 * while the text box is being edited (double-click to edit).
 */
export function RichTextToolbar({ el }: { el: TextElement }) {
  const setEditing = useEditor((s) => s.setEditing)
  const editingId = useEditor((s) => s.editingId)
  const editing = editingId === el.id

  const exec = (command: "bold" | "underline") => {
    if (!editing) setEditing(el.id)
    // Defer so focus lands before the command runs when first entering edit.
    requestAnimationFrame(() => document.execCommand(command))
  }

  return (
    <div className="flex gap-1">
      <Button
        size="icon"
        variant="outline"
        // preventDefault keeps the text selection in the editable box
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec("bold")}
        aria-label="Bold"
      >
        <HugeiconsIcon icon={BoldIcon} size={16} />
      </Button>
      <Button
        size="icon"
        variant="outline"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec("underline")}
        aria-label="Underline"
      >
        <HugeiconsIcon icon={UnderlineIcon} size={16} />
      </Button>
    </div>
  )
}
