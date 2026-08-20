const KNOWLEDGE_DOCS: Record<string, string> = {
  chat: "CopilotChat / CopilotSidebar 提供可定制的流式聊天界面",
  tool: "useFrontendTool 定义前端工具，后端可用 HttpAgent 对接 AG-UI Agent",
  context: "useAgentContext 将应用状态共享给 Agent（v2 版 useCopilotReadable）",
  hitl: "useHumanInTheLoop 暂停 Agent 等待用户确认或选择",
  generative: "useComponent / useRenderTool 实现生成式 UI",
  deepseek: "通过 createDeepSeek + baseURL 接入 DeepSeek，支持思考链与工具调用",
}

const HTML_TEMPLATES: Record<string, (title: string) => string> = {
  landing: (pageTitle) => `<div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:32px;border-radius:16px;text-align:center">
  <h1 style="margin:0 0 12px;font-size:28px">${pageTitle}</h1>
  <p style="opacity:.9;margin:0 0 20px">CopilotKit + DeepSeek 生成式 UI 演示</p>
  <button style="background:#fff;color:#6366f1;border:none;padding:10px 24px;border-radius:8px;font-weight:600;cursor:pointer">立即体验</button>
</div>`,
  dashboard: (pageTitle) => `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
  <div style="background:#f0fdf4;padding:16px;border-radius:12px;border:1px solid #86efac"><strong>用户</strong><p style="font-size:24px;margin:8px 0 0">1,284</p></div>
  <div style="background:#eff6ff;padding:16px;border-radius:12px;border:1px solid #93c5fd"><strong>会话</strong><p style="font-size:24px;margin:8px 0 0">356</p></div>
  <div style="background:#fef3c7;padding:16px;border-radius:12px;border:1px solid #fcd34d"><strong>转化</strong><p style="font-size:24px;margin:8px 0 0">12.8%</p></div>
</div>`,
  card: (pageTitle) => `<article style="max-width:360px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
  <div style="height:120px;background:linear-gradient(90deg,#dbeafe,#e0e7ff)"></div>
  <div style="padding:16px"><h3 style="margin:0 0 8px">${pageTitle}</h3><p style="color:#64748b;margin:0;font-size:14px">由 Agent 生成的 HTML 卡片，可在 iframe 中实时预览。</p></div>
</article>`,
}

export function queryWeather(city: string) {
  const conditions = ["晴", "多云", "小雨", "阴"]
  const temp = 15 + Math.floor(Math.random() * 20)
  return {
    city,
    temperature: temp,
    unit: "°C",
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    humidity: `${40 + Math.floor(Math.random() * 40)}%`,
  }
}

export function searchKnowledge(query: string) {
  const key = Object.keys(KNOWLEDGE_DOCS).find((k) =>
    query.toLowerCase().includes(k),
  )
  return {
    query,
    result: key
      ? KNOWLEDGE_DOCS[key]
      : "未找到相关内容，请尝试：chat、tool、context、hitl、generative",
  }
}

export function calculateExpression(expression: string) {
  const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, "")
  if (!sanitized) throw new Error("表达式无效")
  const result = Function(`"use strict"; return (${sanitized})`)()
  return { expression, result }
}

export function generateProductHtml(
  template: "landing" | "dashboard" | "card",
  title?: string,
) {
  const pageTitle = title ?? `CopilotKit ${template} 预览`
  const build = HTML_TEMPLATES[template] ?? HTML_TEMPLATES.card
  return { title: pageTitle, html: build(pageTitle) }
}
