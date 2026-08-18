import { useEffect, useRef, useState } from "react"

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

interface HtmlPreviewFrameProps {
  html?: string | null
  title?: string
  height?: number
  allowScripts?: boolean
}

/** iframe 沙箱预览 */
export function HtmlPreviewFrame({
  html,
  title = "Preview",
  height = 280,
  allowScripts = false,
}: HtmlPreviewFrameProps) {
  const doc = wrapHtmlDocument(html, title)
  const sandbox = allowScripts
    ? "allow-scripts allow-popups"
    : "allow-popups"

  return (
    <iframe
      className="html-preview-iframe"
      title={title}
      srcDoc={doc}
      sandbox={sandbox}
      style={{ height }}
    />
  )
}

interface HtmlPreviewCardProps {
  title?: string
  html?: string | null
  allowScripts?: boolean
  height?: number
}

/** 生成式 UI：HTML 预览卡片（iframe） */
export function HtmlPreviewCard({
  title = "HTML 预览",
  html = "",
  allowScripts = false,
  height = 280,
}: HtmlPreviewCardProps) {
  const [view, setView] = useState<"preview" | "code">("preview")

  return (
    <div className="gen-card html-preview-card">
      <div className="html-preview-header">
        <h4>🌐 {title}</h4>
        <div className="html-preview-tabs">
          <button
            type="button"
            className={view === "preview" ? "active" : ""}
            onClick={() => setView("preview")}
          >
            预览
          </button>
          <button
            type="button"
            className={view === "code" ? "active" : ""}
            onClick={() => setView("code")}
          >
            源码
          </button>
        </div>
      </div>

      {view === "code" ? (
        <pre className="html-preview-code">{html}</pre>
      ) : (
        <HtmlPreviewFrame
          html={html}
          title={title}
          height={height}
          allowScripts={allowScripts}
        />
      )}
    </div>
  )
}

/** 同步到主页面预览区（避免 render 内直接 setState） */
export function SyncedHtmlPreviewCard({
  title,
  html,
  onSync,
  height,
}: HtmlPreviewCardProps & {
  onSync: (title: string, html: string) => void
}) {
  const synced = useRef(false)
  useEffect(() => {
    if (synced.current || !(html ?? "").trim()) return
    synced.current = true
    onSync(title ?? "HTML 预览", html!)
  }, [title, html, onSync])

  return <HtmlPreviewCard title={title} html={html} height={height} />
}

interface HtmlEditorPreviewCardProps {
  status: string
  defaultTitle?: string
  defaultHtml?: string
  onSubmit: (data: { title: string; html: string }) => void
  onCancel?: () => void
}

/** HITL：可编辑 HTML + 实时 iframe 预览 */
export function HtmlEditorPreviewCard({
  status,
  defaultTitle = "我的页面",
  defaultHtml = "<h1>Hello</h1><p>编辑左侧 HTML，右侧实时预览</p>",
  onSubmit,
  onCancel,
}: HtmlEditorPreviewCardProps) {
  const [title, setTitle] = useState(defaultTitle)
  const [html, setHtml] = useState(defaultHtml)

  if (status === "complete") {
    return (
      <div className="gen-card html-preview-card done">
        ✅ HTML 已提交：{title}
      </div>
    )
  }

  return (
    <div className="gen-card html-preview-card html-editor-card">
      <h4>✏️ 编辑 HTML 并预览</h4>
      <label className="html-editor-title">
        标题
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="页面标题"
        />
      </label>
      <div className="html-editor-split">
        <label className="html-editor-code">
          HTML 源码
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={10}
            spellCheck={false}
          />
        </label>
        <div className="html-editor-preview-pane">
          <HtmlPreviewFrame html={html} title={title} height={220} />
        </div>
      </div>
      <div className="hitl-form-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => onSubmit({ title, html })}
        >
          提交 HTML
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            取消
          </button>
        )}
      </div>
    </div>
  )
}
