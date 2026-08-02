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
