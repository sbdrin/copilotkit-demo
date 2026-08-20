import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import express from "express"
import cors from "cors"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { BuiltInAgent, CopilotRuntime } from "@copilotkit/runtime/v2"
import { createCopilotExpressHandler } from "@copilotkit/runtime/v2/express"
import { HttpAgent } from "@ag-ui/client"
import { createAgnoFetch } from "./agno-proxy.js"

// 优先加载项目根目录 .env，兼容在 server/ 下单独启动
const rootEnv = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.env",
)
dotenv.config({ path: rootEnv })
dotenv.config()

const PORT = Number(process.env.PORT) || 3001

// 后端模式：deepseek = 直连 DeepSeek 代理；ag-ui = 转发到远程 AG-UI 端点
type BackendMode = "deepseek" | "ag-ui"
const backendMode: BackendMode =
  process.env.BACKEND_MODE === "ag-ui" ? "ag-ui" : "deepseek"

type DefaultAgent = InstanceType<typeof BuiltInAgent> | HttpAgent

interface RuntimeMeta {
  mode: BackendMode
  model?: string
  baseURL?: string
  aguiUrl?: string
  agentCode?: string
}

function buildDefaultAgent(): { agent: DefaultAgent; meta: RuntimeMeta } {
  if (backendMode === "ag-ui") {
    const aguiUrl = process.env.AGNO_AGUI_URL
    const jwtToken = process.env.AGNO_JWT_TOKEN
    const agentCode = process.env.AGNO_AGENT_CODE || "default"
    if (!aguiUrl || !jwtToken) {
      console.error(
        "BACKEND_MODE=ag-ui 需要在 .env 中配置 AGNO_AGUI_URL 与 AGNO_JWT_TOKEN",
      )
      process.exit(1)
    }
    const agent = new HttpAgent({
      url: aguiUrl,
      agentId: agentCode,
      headers: { "jwt-token": jwtToken },
      fetch: createAgnoFetch(agentCode, jwtToken),
    })
    return {
      agent,
      meta: { mode: "ag-ui", aguiUrl, agentCode },
    }
  }

  // deepseek 模式：直连 OpenAI 兼容端点
  const apiKey = process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY
  const baseURL = (process.env.LLM_BASE_URL || "https://www.dmxapi.cn").replace(/\/$/, "")
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

  // 启用思考链，前端 CopilotChatReasoningMessage 会自动展示并在结束后折叠
  const agent = new BuiltInAgent({
    model: llm.chat(modelName),
    maxSteps: 5,
    providerOptions: {
      deepseek: {
        thinking: { type: "enabled" },
      },
    },
    prompt: ``,
  })

  return { agent, meta: { mode: "deepseek", model: modelName, baseURL } }
}

const { agent: defaultAgent, meta } = buildDefaultAgent()

const runtime = new CopilotRuntime({
  agents: { default: defaultAgent },
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
  res.json({ ok: true, ...meta })
})

app.listen(PORT, () => {
  console.log(`CopilotKit 后端运行于 http://localhost:${PORT}`)
  console.log(`模式: ${meta.mode}`)
  if (meta.mode === "deepseek") {
    console.log(`模型: ${meta.model} @ ${meta.baseURL}`)
  } else {
    console.log(`AG-UI 端点: ${meta.aguiUrl}`)
    console.log(`AG-UI Agent: ${meta.agentCode}`)
  }
})
