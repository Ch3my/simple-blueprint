import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useProjects } from "@/store/useProjects"
import { HugeiconsIcon, PlusIcon, DeleteIcon } from "@/components/icons"

export function ProjectsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const metas = useProjects((s) => s.metas)
  const currentId = useProjects((s) => s.currentId)
  const refreshList = useProjects((s) => s.refreshList)
  const openProject = useProjects((s) => s.open)
  const newProject = useProjects((s) => s.newProject)
  const remove = useProjects((s) => s.remove)

  useEffect(() => {
    if (open) void refreshList()
  }, [open, refreshList])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Projects</DialogTitle>
          <DialogDescription>
            Open a saved floor plan or start a new one. Projects autosave to this
            browser.
          </DialogDescription>
        </DialogHeader>

        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={async () => {
            await newProject()
            onOpenChange(false)
          }}
        >
          <HugeiconsIcon icon={PlusIcon} size={16} /> New project
        </Button>

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {metas.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No saved projects yet.
            </p>
          )}
          {metas.map((m) => (
            <div
              key={m.id}
              className={`hover:bg-accent flex items-center justify-between rounded-md px-2 py-1.5 ${
                m.id === currentId ? "bg-accent" : ""
              }`}
            >
              <button
                className="flex-1 text-left"
                onClick={async () => {
                  await openProject(m.id)
                  onOpenChange(false)
                }}
              >
                <div className="text-sm font-medium">{m.name}</div>
                <div className="text-muted-foreground text-xs">
                  {new Date(m.updatedAt).toLocaleString()}
                </div>
              </button>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Delete ${m.name}`}
                onClick={() => void remove(m.id)}
              >
                <HugeiconsIcon icon={DeleteIcon} size={16} />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
