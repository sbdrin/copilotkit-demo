import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import express from "express"
import cors from "cors"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { BuiltInAgent, CopilotRuntime } from "@copilotkit/runtime/v2"
import { createCopilotExpressHandler } from "@copilotkit/runtime/v2/express"

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

const builtInAgent = new BuiltInAgent({
  model: llm.chat(modelName),
  maxSteps: 5,
  // 启用思考链，前端 CopilotChatReasoningMessage 会自动展示并在结束后折叠
  providerOptions: {
    deepseek: {
      thinking: { type: "enabled" },
    },
  },
  prompt: `你是 CopilotKit 全功能演示助手。
你可以：
1. 调用前端工具：查天气、搜知识库、计算
2. 调用前端可交互表单（优先用于需要用户填写的场景）：
   - collectFeedback：弹出反馈表单（评分、邮箱、说明）
   - fillContactForm：弹出联系表单（姓名、手机、公司、需求）
   - createTodoWithForm：弹出待办确认表单（比直接 addTodo 更好）
   - scheduleMeeting：弹出会议时间选择器
   - editHtmlPreview：弹出 HTML 编辑器让用户编辑并预览
3. HTML 预览路由（严格按场景选择，不要搞反）：
   - 【默认】用户说「生成 HTML」「HTML 示例」「随便写个页面」「随机生成页面」等：你自己创作完整 HTML 字符串，再调用 showHtmlPreview({ title, html }) 展示。不要调用 generateHtml。
   - 【例外】仅当用户明确要「产品介绍」「产品落地页」「产品宣传页」时：才调用 generateHtml（结果会自动预览，禁止再调 showHtmlPreview）。
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
