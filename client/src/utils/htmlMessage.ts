/** 将 assistant message.content 规范为字符串 */
export function normalizeAssistantContent(content: unknown): string {
  if (!content) return ""
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (
          part &&
          typeof part === "object" &&
          "type" in part &&
          part.type === "text" &&
          typeof part.text === "string"
        ) {
          return part.text
        }
        return ""
      })
      .filter((text) => text.length > 0)
      .join("\n")
  }
  return ""
}

export interface ExtractedAssistantHtml {
  html: string
  complete: boolean
  preamble?: string
}

const HTML_FENCE_RE = /```(?:html|htm)\b[^\n]*\n?/i
const FULL_HTML_DOC_RE = /^<!doctype\s+html|^<html[\s>]/i

/**
 * 从 assistant 文本中提取 HTML（AG-UI 常把 HTML 包在 ```html 代码块里）。
 * 返回 null 表示应按普通 Markdown 渲染。
 */
export function extractHtmlFromAssistantContent(
  content: unknown,
  isStreaming = false,
): ExtractedAssistantHtml | null {
  const text = normalizeAssistantContent(content)
  if (!text) return null

  const fenceIdx = text.search(HTML_FENCE_RE)
  if (fenceIdx >= 0) {
    const preamble =
      fenceIdx > 0 ? text.slice(0, fenceIdx).trim() : undefined
    const afterFence = text.slice(fenceIdx)
    const openMatch = afterFence.match(HTML_FENCE_RE)
    if (!openMatch) return null

    const bodyStart = openMatch.index! + openMatch[0].length
    const body = afterFence.slice(bodyStart)
    const closeIdx = body.indexOf("```")
    const html =
      closeIdx >= 0 ? body.slice(0, closeIdx) : body
    const complete = closeIdx >= 0 || !isStreaming

    return { html, complete, preamble }
  }

  const trimmed = text.trim()
  if (FULL_HTML_DOC_RE.test(trimmed)) {
    return { html: trimmed, complete: !isStreaming }
  }

  return null
}
