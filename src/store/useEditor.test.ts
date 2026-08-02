import { beforeEach, describe, expect, it } from "vitest"
import { useEditor } from "@/store/useEditor"
import type { Element } from "@/types/blueprint"

const HISTORY_LIMIT = 50

function rect(id: string, x = 0, y = 0): Element {
  return {
    id,
    type: "rectangle",
    x,
    y,
    w: 1,
    h: 1,
    rotation: 0,
    stroke: "#000",
    strokeWidth: 0.03,
    z: 0,
    fill: "none",
  }
}

const editor = () => useEditor.getState()
const historyDepth = () => editor().past.length

beforeEach(() => {
  editor().reset()
})

describe("mutations record their own history", () => {
  it("starts with nothing to undo", () => {
    expect(editor().canUndo()).toBe(false)
    expect(editor().canRedo()).toBe(false)
  })

  it("records adding, updating, removing and reordering", () => {
    editor().addElement(rect("a"))
    expect(historyDepth()).toBe(1)

    editor().updateElement("a", { x: 5 })
    expect(historyDepth()).toBe(2)

    editor().bringForward("a")
    expect(historyDepth()).toBe(3)

    editor().sendBackward("a")
    expect(historyDepth()).toBe(4)

    editor().removeElement("a")
    expect(historyDepth()).toBe(5)
  })

  it("undoes one mutation at a time", () => {
    editor().addElement(rect("a"))
    editor().updateElement("a", { x: 5 })
    editor().updateElement("a", { x: 9 })

    editor().undo()
    expect(editor().elements[0].x).toBe(5)

    editor().undo()
    expect(editor().elements[0].x).toBe(0)

    editor().undo()
    expect(editor().elements).toHaveLength(0)
    expect(editor().canUndo()).toBe(false)
  })

  it("keeps settings out of the history", () => {
    editor().updateSettings({ gridSize: 0.5 })
    expect(historyDepth()).toBe(0)
    expect(editor().canUndo()).toBe(false)
  })

  it("ignores undo and redo when there is nothing to apply", () => {
    editor().undo()
    editor().redo()
    expect(editor().elements).toHaveLength(0)
    expect(historyDepth()).toBe(0)
  })

  it("caps the history and drops the oldest entries", () => {
    editor().addElement(rect("a"))
    for (let i = 0; i < HISTORY_LIMIT + 10; i++) {
      editor().updateElement("a", { x: i })
    }
    expect(historyDepth()).toBe(HISTORY_LIMIT)
  })
})

describe("redo", () => {
  it("replays what undo took back", () => {
    editor().addElement(rect("a"))
    editor().updateElement("a", { x: 7 })

    editor().undo()
    expect(editor().elements[0].x).toBe(0)
    expect(editor().canRedo()).toBe(true)

    editor().redo()
    expect(editor().elements[0].x).toBe(7)
  })

  it("is discarded once a new mutation happens", () => {
    editor().addElement(rect("a"))
    editor().updateElement("a", { x: 7 })
    editor().undo()
    expect(editor().canRedo()).toBe(true)

    editor().updateElement("a", { x: 3 })
    expect(editor().canRedo()).toBe(false)
  })
})

describe("gestures group mutations into one undo step", () => {
  it("collapses a run of updates, as a drag or a typed field does", () => {
    editor().addElement(rect("a"))
    const depthBefore = historyDepth()

    editor().beginGesture()
    for (let i = 1; i <= 10; i++) editor().updateElement("a", { x: i })
    editor().endGesture()

    expect(historyDepth()).toBe(depthBefore + 1)
    expect(editor().elements[0].x).toBe(10)

    editor().undo()
    expect(editor().elements[0].x).toBe(0)
  })

  it("records nothing at all when a gesture never mutates", () => {
    // Clicking a shape without moving it, or focusing a field and typing
    // nothing, must not cost the user an undo press.
    editor().beginGesture()
    editor().endGesture()
    expect(historyDepth()).toBe(0)
    expect(editor().canUndo()).toBe(false)
  })

  it("captures the state from before the gesture, not mid-way through", () => {
    editor().addElement(rect("a", 100, 200))

    editor().beginGesture()
    editor().updateElement("a", { x: 1 })
    editor().updateElement("a", { x: 2 })
    editor().endGesture()

    editor().undo()
    expect(editor().elements[0].x).toBe(100)
    expect(editor().elements[0].y).toBe(200)
  })

  it("keeps consecutive gestures as separate steps", () => {
    editor().addElement(rect("a"))

    editor().beginGesture()
    editor().updateElement("a", { x: 1 })
    editor().endGesture()

    editor().beginGesture()
    editor().updateElement("a", { x: 2 })
    editor().endGesture()

    editor().undo()
    expect(editor().elements[0].x).toBe(1)
    editor().undo()
    expect(editor().elements[0].x).toBe(0)
  })

  it("goes back to recording every mutation after the gesture closes", () => {
    editor().addElement(rect("a"))
    editor().beginGesture()
    editor().updateElement("a", { x: 1 })
    editor().endGesture()

    const depth = historyDepth()
    editor().updateElement("a", { x: 2 })
    editor().updateElement("a", { x: 3 })
    expect(historyDepth()).toBe(depth + 2)
  })

  it("groups different kinds of mutation inside one gesture", () => {
    editor().beginGesture()
    editor().addElement(rect("a"))
    editor().updateElement("a", { x: 4 })
    editor().endGesture()

    expect(historyDepth()).toBe(1)
    editor().undo()
    expect(editor().elements).toHaveLength(0)
  })

  it("survives an unpaired endGesture", () => {
    editor().endGesture()
    editor().addElement(rect("a"))
    expect(historyDepth()).toBe(1)
  })

  it("does not swallow later mutations if a gesture is left open", () => {
    // A gesture left open by a missed endGesture must not silently merge
    // everything that follows into one entry forever. undo() closes it.
    editor().addElement(rect("a"))
    editor().beginGesture()
    editor().updateElement("a", { x: 1 })
    editor().undo()

    const depth = historyDepth()
    editor().updateElement("a", { x: 2 })
    expect(historyDepth()).toBe(depth + 1)
  })
})

describe("project loading", () => {
  it("clears the history so undo cannot cross into another project", () => {
    editor().addElement(rect("a"))
    editor().updateElement("a", { x: 5 })
    expect(editor().canUndo()).toBe(true)

    editor().loadProject([rect("b")], editor().settings)
    expect(editor().canUndo()).toBe(false)
    expect(editor().canRedo()).toBe(false)
    expect(editor().elements[0].id).toBe("b")
  })

  it("drops the selection when loading", () => {
    editor().addElement(rect("a"))
    expect(editor().selectedId).toBe("a")
    editor().loadProject([rect("b")], editor().settings)
    expect(editor().selectedId).toBeNull()
  })
})

describe("selection and stacking", () => {
  it("selects a newly added element", () => {
    editor().addElement(rect("a"))
    expect(editor().selectedId).toBe("a")
  })

  it("clears selection and editing when the element is removed", () => {
    editor().addElement(rect("a"))
    editor().setEditing("a")
    editor().removeElement("a")
    expect(editor().selectedId).toBeNull()
    expect(editor().editingId).toBeNull()
  })

  it("gives each new element a higher z than the last", () => {
    editor().addElement(rect("a"))
    editor().addElement(rect("b"))
    const [a, b] = editor().elements
    expect(b.z).toBeGreaterThan(a.z)
  })

  it("moves an element above and below its siblings", () => {
    editor().addElement(rect("a"))
    editor().addElement(rect("b"))

    editor().bringForward("a")
    const zOf = (id: string) => editor().elements.find((e) => e.id === id)!.z
    expect(zOf("a")).toBeGreaterThan(zOf("b"))

    editor().sendBackward("a")
    expect(zOf("a")).toBeLessThan(zOf("b"))
  })
})

describe("view lock", () => {
  it("drops selection and returns to the select tool when locking", () => {
    editor().addElement(rect("a"))
    editor().setTool("rectangle")
    editor().setEditing("a")

    editor().toggleViewLock()
    expect(editor().viewLock).toBe(true)
    expect(editor().tool).toBe("select")
    expect(editor().selectedId).toBeNull()
    expect(editor().editingId).toBeNull()
  })

  it("unlocks without disturbing the document", () => {
    editor().addElement(rect("a"))
    editor().toggleViewLock()
    editor().toggleViewLock()
    expect(editor().viewLock).toBe(false)
    expect(editor().elements).toHaveLength(1)
  })

  it("is not undoable — it is a view preference, not an edit", () => {
    editor().toggleViewLock()
    expect(editor().canUndo()).toBe(false)
  })
})
