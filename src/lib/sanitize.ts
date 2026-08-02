// Minimal allow-list sanitizer for the simple rich text in text elements.
// Permits only inline formatting tags and line breaks; strips everything else
// (scripts, styles, attributes, event handlers).

const ALLOWED_TAGS = new Set([
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "BR",
  "DIV",
  "P",
  "SPAN",
])

export function sanitizeHtml(html: string): string {
  const template = document.createElement("template")
  template.innerHTML = html
  clean(template.content)
  return template.innerHTML
}

/**
 * Flatten a text element's html to plain text, turning <br> and block ends into
 * newlines. Used by the properties panel, which edits the text as plain lines.
 */
export function htmlToText(html: string): string {
  const template = document.createElement("template")
  template.innerHTML = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p)>/gi, "\n")
  return (template.content.textContent ?? "").replace(/\n$/, "")
}

/** Inverse of htmlToText: escape the text and keep its line breaks. */
export function textToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")
}

function clean(node: Node): void {
  const children = Array.from(node.childNodes)
  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) continue
    if (child.nodeType !== Node.ELEMENT_NODE) {
      child.remove()
      continue
    }
    const el = child as Element
    if (!ALLOWED_TAGS.has(el.tagName)) {
      // Unwrap unknown elements: keep their text content, drop the tag.
      el.replaceWith(...Array.from(el.childNodes))
      continue
    }
    // Strip every attribute (no inline styles, no handlers).
    for (const attr of Array.from(el.attributes)) {
      el.removeAttribute(attr.name)
    }
    clean(el)
  }
}
