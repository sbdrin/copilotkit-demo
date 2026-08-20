import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import express from "express"
import cors from "cors"
import { createDeepSeek } from "@ai-sdk/deepseek"
import {
  BuiltInAgent,
  CopilotRuntime,
  defineTool,
} from "@copilotkit/runtime/v2"
import { createCopilotExpressHandler } from "@copilotkit/runtime/v2/express"
import { z } from "zod"

// 优先加载项目根目录 .env，兼容在 server/ 下单独启动
const rootEnv = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.env",
)
dotenv.config({ path: rootEnv })
dotenv.config()

const PORT = Number(process.env.PORT) || 3001
const apiKey = process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY
const baseURL = (
  process.env.LLM_BASE_URL ||
  process.env.DEEPSEEK_BASE_URL ||
  "https://www.dmxapi.cn"
).replace(/\/$/, "")
if (!apiKey) {
  console.error("缺少 LLM_API_KEY，请在项目根目录 .env 中配置")
  process.exit(1)
}

// DeepSeek 兼容端点：用 @ai-sdk/deepseek 才能正确解析 reasoning_content 流
const llm = createDeepSeek({
  apiKey,
  baseURL: baseURL.endsWith("/v1") ? baseURL : `${baseURL}/v1`,
})

const modelName =
  process.env.LLM_MODEL ||
  process.env.DEEPSEEK_MODEL ||
  "deepseek-v4-flash-0731"

// ── 后端工具（Server Tools）────────────────────────────────────
const getWeather = defineTool({
  name: "getWeather",
  description: "查询指定城市的当前天气",
  parameters: z.object({
    city: z.string().describe("城市名称，如：北京、上海"),
  }),
  execute: async ({ city }) => {
    const conditions = ["晴", "多云", "小雨", "阴"]
    const temp = 15 + Math.floor(Math.random() * 20)
    return {
      city,
      temperature: temp,
      unit: "°C",
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: `${40 + Math.floor(Math.random() * 40)}%`,
      source: "server-tool",
    }
  },
})

const searchKnowledge = defineTool({
  name: "searchKnowledge",
  description: "搜索内置知识库，获取 CopilotKit 功能说明",
  parameters: z.object({
    query: z.string().describe("搜索关键词"),
  }),
  execute: async ({ query }) => {
    const docs: Record<string, string> = {
      chat: "CopilotChat / CopilotSidebar 提供可定制的流式聊天界面",
      tool: "useFrontendTool 定义前端工具，defineTool 定义后端工具",
      context: "useAgentContext 将应用状态共享给 Agent（v2 版 useCopilotReadable）",
      hitl: "useHumanInTheLoop 暂停 Agent 等待用户确认或选择",
      generative: "useComponent / useRenderTool 实现生成式 UI",
      deepseek: "通过 createDeepSeek + baseURL 接入 DeepSeek，支持思考链与工具调用",
    }
    const key = Object.keys(docs).find((k) => query.toLowerCase().includes(k))
    return {
      query,
      result: key ? docs[key] : "未找到相关内容，请尝试：chat、tool、context、hitl、generative",
      source: "server-tool",
    }
  },
})

const calculate = defineTool({
  name: "calculate",
  description: "执行数学表达式计算",
  parameters: z.object({
    expression: z.string().describe("数学表达式，如：2+3*4"),
  }),
  execute: async ({ expression }) => {
    // ponytail: 演示用简单 eval，生产环境应使用 math 库
    const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, "")
    if (!sanitized) throw new Error("表达式无效")
    const result = Function(`"use strict"; return (${sanitized})`)()
    return { expression, result, source: "server-tool" }
  },
})

const generateHtml = defineTool({
  name: "generateHtml",
  description:
    "【仅限产品介绍】用固定模板生成「产品介绍」类 HTML 并自动预览。仅当用户明确要求「产品介绍」「产品落地页」「产品宣传页」时才调用。普通「生成 HTML / HTML 示例 / 随便写个页面」禁止调用本工具，应自行编写 HTML 后调用 showHtmlPreview。",
  parameters: z.object({
    template: z
      .enum(["landing", "dashboard", "card"])
      .describe("产品介绍模板类型：landing 落地页、dashboard 数据看板、card 产品卡片"),
    title: z.string().optional().describe("产品/页面标题"),
  }),
  execute: async ({ template, title }) => {
    const pageTitle = title ?? `CopilotKit ${template} 预览`
    const templates: Record<string, string> = {
      landing: `<div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:32px;border-radius:16px;text-align:center">
  <h1 style="margin:0 0 12px;font-size:28px">${pageTitle}</h1>
  <p style="opacity:.9;margin:0 0 20px">CopilotKit + DeepSeek 生成式 UI 演示</p>
  <button style="background:#fff;color:#6366f1;border:none;padding:10px 24px;border-radius:8px;font-weight:600;cursor:pointer">立即体验</button>
</div>`,
      dashboard: `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
  <div style="background:#f0fdf4;padding:16px;border-radius:12px;border:1px solid #86efac"><strong>用户</strong><p style="font-size:24px;margin:8px 0 0">1,284</p></div>
  <div style="background:#eff6ff;padding:16px;border-radius:12px;border:1px solid #93c5fd"><strong>会话</strong><p style="font-size:24px;margin:8px 0 0">356</p></div>
  <div style="background:#fef3c7;padding:16px;border-radius:12px;border:1px solid #fcd34d"><strong>转化</strong><p style="font-size:24px;margin:8px 0 0">12.8%</p></div>
</div>`,
      card: `<article style="max-width:360px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
  <div style="height:120px;background:linear-gradient(90deg,#dbeafe,#e0e7ff)"></div>
  <div style="padding:16px"><h3 style="margin:0 0 8px">${pageTitle}</h3><p style="color:#64748b;margin:0;font-size:14px">由 Agent 生成的 HTML 卡片，可在 iframe 中实时预览。</p></div>
</article>`,
    }
    return { title: pageTitle, html: templates[template] ?? templates.card }
  },
})

const builtInAgent = new BuiltInAgent({
  model: llm.chat(modelName),
  tools: [getWeather, searchKnowledge, calculate, generateHtml],
  maxSteps: 5,
  // 启用思考链，前端 CopilotChatReasoningMessage 会自动展示并在结束后折叠
  providerOptions: {
    deepseek: {
      thinking: { type: "enabled" },
    },
  },
  prompt: `你是 CopilotKit 全功能演示助手。
你可以：
1. 调用后端工具：查天气、搜知识库、计算
2. 调用前端可交互表单（优先用于需要用户填写的场景）：
   - collectFeedback：弹出反馈表单（评分、邮箱、说明）
   - fillContactForm：弹出联系表单（姓名、手机、公司、需求）
   - createTodoWithForm：弹出待办确认表单（比直接 addTodo 更好）
   - scheduleMeeting：弹出会议时间选择器
   - editHtmlPreview：弹出 HTML 编辑器让用户编辑并预览
3. HTML 预览路由（严格按场景选择，不要搞反）：
   - 【默认】用户说「生成 HTML」「HTML 示例」「随便写个页面」「随机生成页面」等：你自己创作完整 HTML 字符串，再调用 showHtmlPreview({ title, html }) 展示。不要调用 generateHtml。
   - 【例外】仅当用户明确要「产品介绍」「产品落地页」「产品宣传页」时：才调用后端 generateHtml（结果会自动预览，禁止再调 showHtmlPreview）。
4. 调用前端工具 addTodo/toggleTodo/removeTodo（无需表单的快速操作）
5. 读取用户上下文：待办列表、表单提交记录、HTML 预览记录、用户信息
请用中文回复，简洁友好。`,
})

const runtime = new CopilotRuntime({
  agents: { default: builtInAgent },
})

const app = express()
app.use(cors({ origin: true }))
app.use(
  createCopilotExpressHandler({
    runtime,
    basePath: "/api/copilotkit",
    mode: "single-route",
    cors: true,
  }),
)

app.get("/health", (_req, res) => {
  res.json({ ok: true, model: modelName, baseURL })
})

app.listen(PORT, () => {
  console.log(`CopilotKit 后端运行于 http://localhost:${PORT}`)
  console.log(`模型: ${modelName} @ ${baseURL}`)
})
