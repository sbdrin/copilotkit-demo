import { useEffect, useId, useMemo, useRef, useState } from 'react'

/** 包装片段为完整 HTML 文档 */
export function wrapHtmlDocument(html?: string | null, title = 'Preview') {
  const trimmed = (html ?? '').trim()
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

/** iframe 沙箱预览（默认允许脚本；不加 allow-same-origin，避免访问父页） */
export function HtmlPreviewFrame({
  html,
  title = 'Preview',
  height = 280,
  allowScripts = true
}: HtmlPreviewFrameProps) {
  const doc = wrapHtmlDocument(html, title)
  // 无 allow-same-origin：脚本可跑，但无法读父文档 / cookie
  const sandbox = allowScripts
    ? 'allow-scripts allow-popups allow-forms'
    : 'allow-popups allow-forms'

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
  /** false：生成中强制源码；变为 true 后自动切到预览 */
  complete?: boolean
}

/** 生成式 UI：HTML 预览卡片（iframe） */
export function HtmlPreviewCard({
  title = 'HTML 预览',
  html = '',
  allowScripts = true,
  height = 280,
  complete = true
}: HtmlPreviewCardProps) {
  const [view, setView] = useState<'preview' | 'code'>(
    complete ? 'preview' : 'code'
  )
  const wasComplete = useRef(complete)

  useEffect(() => {
    if (!complete) {
      setView('code')
    } else if (!wasComplete.current) {
      setView('preview')
    }
    wasComplete.current = complete
  }, [complete])

  const codeRef = useRef<HTMLPreElement>(null)
  useEffect(() => {
    if (view !== 'code' || complete) return
    const el = codeRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [html, view, complete])

  return (
    <div className="gen-card html-preview-card">
      <div className="html-preview-header">
        <h4>
          🌐 {title}
          {!complete ? ' · 生成中' : ''}
        </h4>
        <div className="html-preview-tabs">
          <button
            type="button"
            className={view === 'preview' ? 'active' : ''}
            disabled={!complete}
            onClick={() => setView('preview')}
          >
            预览
          </button>
          <button
            type="button"
            className={view === 'code' ? 'active' : ''}
            onClick={() => setView('code')}
          >
            源码
          </button>
        </div>
      </div>

      {view === 'code' ? (
        <pre ref={codeRef} className="html-preview-code">
          {html || '⏳ 正在生成 HTML…'}
        </pre>
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

/** 跨组件实例去重，避免 generateHtml + showHtmlPreview 重复渲染 */
const RECENT_HTML_MS = 60_000
const recentHtmlSlots = new Map<string, { at: number; ownerId: string }>()

function getHtmlPreviewKey(title: string, html: string) {
  return `${title}::${html.trim()}`
}

/** 抢占预览槽位；同一 ownerId（含 Strict Mode 重挂载）可重复抢占 */
function claimHtmlPreviewSlot(key: string, ownerId: string) {
  const now = Date.now()
  const slot = recentHtmlSlots.get(key)
  if (
    slot != null &&
    slot.ownerId !== ownerId &&
    now - slot.at < RECENT_HTML_MS
  ) {
    return false
  }
  recentHtmlSlots.set(key, { at: now, ownerId })
  return true
}

/** 同步到主页面预览区（避免 render 内直接 setState） */
export function SyncedHtmlPreviewCard({
  title,
  html,
  onSync,
  height,
  complete = true
}: HtmlPreviewCardProps & {
  onSync: (title: string, html: string) => void
}) {
  const ownerId = useId()
  const resolvedTitle = title ?? 'HTML 预览'
  const trimmedHtml = (html ?? '').trim()
  const synced = useRef(false)

  const shouldRender = useMemo(() => {
    // 生成中始终展示源码流，不参与去重抢占
    if (!complete || !trimmedHtml) return true
    return claimHtmlPreviewSlot(
      getHtmlPreviewKey(resolvedTitle, trimmedHtml),
      ownerId
    )
  }, [resolvedTitle, trimmedHtml, ownerId, complete])

  useEffect(() => {
    if (!complete || !trimmedHtml || !shouldRender) return
    if (synced.current) return
    synced.current = true
    onSync(resolvedTitle, trimmedHtml)
  }, [resolvedTitle, trimmedHtml, onSync, shouldRender, complete])

  if (!shouldRender) return null

  return (
    <HtmlPreviewCard
      title={resolvedTitle}
      html={trimmedHtml}
      height={height}
      complete={complete}
    />
  )
}

type HitlRespond = (result: Record<string, unknown>) => void

interface HtmlEditorPreviewCardProps {
  status: string
  defaultTitle?: string
  defaultHtml?: string
  respond?: HitlRespond
  onSync?: (title: string, html: string) => void
}

/** HITL：可编辑 HTML + 实时 iframe 预览 */
export function HtmlEditorPreviewCard({
  status,
  defaultTitle = '我的页面',
  defaultHtml = '<h1>Hello</h1><p>编辑左侧 HTML，右侧实时预览</p>',
  respond,
  onSync
}: HtmlEditorPreviewCardProps) {
  const [title, setTitle] = useState(defaultTitle)
  const [html, setHtml] = useState(defaultHtml)
  const [error, setError] = useState<string | null>(null)

  const canRespond = status === 'executing' && typeof respond === 'function'

  if (status === 'complete') {
    return (
      <div className="html-editor-done">
        <p className="hitl-form-sub">✅ HTML 已提交（已同步到右侧预览区）</p>
        <HtmlPreviewCard title={title} html={html} height={200} />
      </div>
    )
  }

  const handleSubmit = () => {
    const trimmed = html.trim()
    if (!trimmed) {
      setError('请填写 HTML 内容后再提交')
      return
    }
    setError(null)
    onSync?.(title, trimmed)
    if (!canRespond || !respond) return
    respond({ submitted: true, title, html: trimmed })
  }

  const handleCancel = () => {
    if (!canRespond || !respond) return
    respond({ submitted: false, reason: '用户取消' })
  }

  return (
    <div className="gen-card html-preview-card html-editor-card">
      <h4>✏️ 编辑 HTML 并预览</h4>
      {!canRespond && (
        <p className="hitl-form-sub">⏳ 编辑器加载中，稍候即可提交…</p>
      )}
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
            onChange={(e) => {
              setHtml(e.target.value)
              if (error) setError(null)
            }}
            rows={10}
            spellCheck={false}
          />
        </label>
        <div className="html-editor-preview-pane">
          <HtmlPreviewFrame html={html} title={title} height={220} />
        </div>
      </div>
      {error && <p className="hitl-form-error">{error}</p>}
      <div className="hitl-form-actions">
        <button
          type="button"
          className="btn-primary"
          disabled={!canRespond}
          onClick={handleSubmit}
        >
          {canRespond ? '提交 HTML' : '准备中…'}
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={!canRespond}
          onClick={handleCancel}
        >
          取消
        </button>
      </div>
    </div>
  )
}
