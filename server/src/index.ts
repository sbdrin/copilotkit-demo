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

const modelName = process.env.LLM_MODEL || "deepseek-v4-flash-0731"

const builtInAgent = new BuiltInAgent({
  model: llm.chat(modelName),
  maxSteps: 5,
  // 启用思考链，前端 CopilotChatReasoningMessage 会自动展示并在结束后折叠
  providerOptions: {
    deepseek: {
      thinking: { type: "enabled" },
    },
  },
  prompt: ``,
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
