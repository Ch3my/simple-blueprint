import { useExport } from "@/store/useExport"

/** Full-screen white mask shown while a PNG capture or print is in progress. */
export function CaptureOverlay() {
  const capturing = useExport((s) => s.capturing)
  const printing = useExport((s) => s.printing)

  if (!capturing && !printing) return null

  return (
    <div
      className="screen-only"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ fontSize: 13, color: "#999" }}>
        {printing ? "Preparing print…" : "Exporting…"}
      </span>
    </div>
  )
}
