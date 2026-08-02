import { describe, expect, it } from "vitest"
import { sanitizeHtml } from "@/lib/sanitize"

describe("sanitizeHtml", () => {
  it("keeps the inline formatting the editor produces", () => {
    expect(sanitizeHtml("<b>bold</b> and <u>under</u>")).toBe(
      "<b>bold</b> and <u>under</u>",
    )
    expect(sanitizeHtml("line<br>break")).toBe("line<br>break")
  })

  it("drops attributes, including inline styles and event handlers", () => {
    expect(sanitizeHtml('<b style="color:red">x</b>')).toBe("<b>x</b>")
    expect(sanitizeHtml('<span onclick="alert(1)">x</span>')).toBe(
      "<span>x</span>",
    )
  })

  it("unwraps disallowed elements but keeps their text", () => {
    expect(sanitizeHtml("<h1>Title</h1>")).toBe("Title")
    expect(sanitizeHtml("<a href='http://x'>link</a>")).toBe("link")
  })

  it("removes a script element entirely rather than unwrapping its source", () => {
    // Unwrapping would leave the code as visible text; dropping it is correct.
    expect(sanitizeHtml("<script>alert(1)</script>ok")).toBe("ok")
  })

  it("drops stylesheet and noscript content rather than showing it as text", () => {
    expect(sanitizeHtml("<style>b{color:red}</style>text")).toBe("text")
    expect(sanitizeHtml("<noscript>enable js</noscript>text")).toBe("text")
  })

  it("strips an image with an onerror payload", () => {
    const out = sanitizeHtml('<img src="x" onerror="alert(1)"><b>ok</b>')
    expect(out).toBe("<b>ok</b>")
    expect(out).not.toContain("onerror")
  })

  it("cleans nested markup at every depth", () => {
    expect(
      sanitizeHtml('<div><b onclick="x"><h2>deep</h2></b></div>'),
    ).toBe("<div><b>deep</b></div>")
  })

  it("leaves plain text and empty input alone", () => {
    expect(sanitizeHtml("just text")).toBe("just text")
    expect(sanitizeHtml("")).toBe("")
  })

  it("is idempotent — sanitizing twice changes nothing further", () => {
    const dirty = '<div><img src=x onerror=alert(1)><b style="color:red">hi</b></div>'
    const once = sanitizeHtml(dirty)
    expect(sanitizeHtml(once)).toBe(once)
  })
})
