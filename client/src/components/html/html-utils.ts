/** 包装片段为完整 HTML 文档 */
export function wrapHtmlDocument(html?: string | null, title = "Preview") {
  const trimmed = (html ?? "").trim()
  if (!trimmed) {
    return `<!DOCTYPE html><html><body><p style="color:#94a3b8;padding:16px">暂无 HTML 内容</p></body></html>`
  }
  if (/<!doctype|<html[\s>]/i.test(trimmed)) return trimmed
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; padding: 16px; }
  </style>
</head>
<body>${trimmed}</body>
</html>`
}
