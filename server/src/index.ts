import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import express from "express"
import cors from "cors"
import { AgnoAgent } from "@ag-ui/agno"
import { CopilotRuntime } from "@copilotkit/runtime/v2"
import { createCopilotExpressHandler } from "@copilotkit/runtime/v2/express"

const rootEnv = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.env",
)
dotenv.config({ path: rootEnv })
dotenv.config()

const PORT = Number(process.env.PORT) || 3001

const AGNO_URL =
  process.env.AGNO_AGUI_URL?.trim() ||
  "https://dkkgdev.devdolphin.com/la-atc-agent-mg-backend/api/v1/agui"
const AGNO_TOKEN = process.env.AGNO_JWT_TOKEN?.trim()
const AGENT_CODE = process.env.AGNO_AGENT_CODE?.trim() || "AGENT_005"

const agnoHeaders: Record<string, string> = AGNO_TOKEN
  ? { "jwt-token": AGNO_TOKEN }
  : {}

type AgnoRunMeta = { threadId: string; runId: string }

function readRunMeta(bodyText?: string): AgnoRunMeta {
  const fallback: AgnoRunMeta = {
    threadId: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    runId: `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }
  if (!bodyText) return fallback
  try {
    const body = JSON.parse(bodyText) as Record<string, unknown>
    return {
      threadId:
        typeof body.threadId === "string" ? body.threadId : fallback.threadId,
      runId: typeof body.runId === "string" ? body.runId : fallback.runId,
    }
  } catch {
    return fallback
  }
}

function patchAgnoBody(bodyText: string): string {
  const body = JSON.parse(bodyText) as Record<string, unknown>
  const meta = readRunMeta(bodyText)
  body.threadId = meta.threadId
  body.runId = meta.runId
  if (!body.state) body.state = {}
  if (!body.tools) body.tools = []
  if (!body.context) body.context = []
  const forwardedProps =
    (body.forwardedProps as Record<string, unknown> | undefined) ?? {}
  body.forwardedProps = {
    ...forwardedProps,
    agent_code: AGENT_CODE,
  }
  return JSON.stringify(body)
}

function agnoErrorResponse(
  message: string,
  code: string,
  meta: AgnoRunMeta,
): Response {
  const events = [
    { type: "RUN_STARTED", threadId: meta.threadId, runId: meta.runId },
    { type: "RUN_ERROR", message, code },
  ]
  const body = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("")
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/event-stream; charset=utf-8" },
  })
}

function parseAgnoError(text: string, status: number): string {
  try {
    const json = JSON.parse(text) as {
      message?: string
      code?: number
      status?: number
    }
    if (json.message) return json.message
    if (json.code !== undefined) return `Agno 错误 code=${json.code}`
  } catch {
    // 非 JSON，使用原始文本
  }
  return text.trim() || `Agno 请求失败 (HTTP ${status})`
}

function formatStreamError(err: unknown): string {
  if (err instanceof Error) {
    const cause =
      err.cause instanceof Error
        ? err.cause.message
        : typeof err.cause === "string"
          ? err.cause
          : undefined
    if (cause && cause !== err.message) return `${err.message} (${cause})`
    return err.message
  }
  return "Agno SSE 流意外中断"
}

function logRawError(label: string, err: unknown): void {
  console.error(label)
  if (err instanceof Error) {
    console.error(err)
    if (err.cause !== undefined) {
      console.error(`${label} [cause]`, err.cause)
    }
    return
  }
  console.error(err)
}

function isAgnoStreamAbortError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  if (err.message === "terminated") return true
  const cause = err.cause as { code?: string } | undefined
  return cause?.code === "UND_ERR_SOCKET"
}

function sseEvent(event: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
}

/** 代理 Agno SSE：流中断时补发 RUN_ERROR，避免 undici 异常打崩进程 */
function wrapSseResponse(upstream: Response, meta: AgnoRunMeta): Response {
  const upstreamBody = upstream.body
  if (!upstreamBody) {
    return agnoErrorResponse("Agno 返回空 SSE 响应", "AGNO_EMPTY_SSE", meta)
  }

  const reader = upstreamBody.getReader()
  let runErrorEmitted = false

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            controller.close()
            return
          }
          if (value) controller.enqueue(value)
        }
      } catch (err) {
        logRawError("[proxy] Agno SSE 流中断（原始错误）", err)
        const message = formatStreamError(err)
        if (!runErrorEmitted) {
          runErrorEmitted = true
          controller.enqueue(
            sseEvent({
              type: "RUN_ERROR",
              message,
              code: "AGNO_STREAM_INTERRUPTED",
            }),
          )
        }
        controller.close()
      } finally {
        reader.releaseLock()
      }
    },
    cancel() {
      reader.cancel().catch(() => {})
    },
  })

  return new Response(stream, {
    status: upstream.status,
    headers: upstream.headers,
  })
}

/** Agno 后端必填字段补全 + 注入 agent_code（参考 kdl-agent copilotkit route） */
const customFetch: typeof fetch = async (input, init) => {
  let runMeta = readRunMeta(
    typeof init?.body === "string" ? init.body : undefined,
  )

  if (!AGNO_TOKEN) {
    console.error("[proxy] 缺少 AGNO_JWT_TOKEN")
    return agnoErrorResponse(
      "缺少 AGNO_JWT_TOKEN：请从 kdl-agent 全局配置 agno_jwt_token 复制到 .env",
      "MISSING_JWT",
      runMeta,
    )
  }

  if (init?.body && typeof init.body === "string") {
    try {
      const patchedBody = patchAgnoBody(init.body)
      init = { ...init, body: patchedBody }
      runMeta = readRunMeta(patchedBody)
      console.log("[proxy] → agno", {
        threadId: runMeta.threadId,
        runId: runMeta.runId,
        agentCode: AGENT_CODE,
      })
    } catch {
      // 解析失败保持原样转发
    }
  }

  let res: Response
  try {
    res = await fetch(input, init)
  } catch (err) {
    logRawError("[proxy] Agno 连接失败（原始错误）", err)
    const message =
      err instanceof Error ? err.message : "无法连接 Agno AG-UI 端点"
    console.error("[proxy] Agno 连接失败:", message)
    return agnoErrorResponse(message, "AGNO_UNREACHABLE", runMeta)
  }

  const ct = res.headers.get("content-type") || ""
  console.log("[proxy] ← agno", res.status, ct)

  if (!ct.includes("text/event-stream")) {
    const text = await res.text()
    const message = parseAgnoError(text, res.status)
    console.error("[proxy] Agno 非 SSE:", message, text.slice(0, 200))
    return agnoErrorResponse(message, `AGNO_HTTP_${res.status}`, runMeta)
  }

  return wrapSseResponse(res, runMeta)
}

process.on("unhandledRejection", (reason) => {
  if (isAgnoStreamAbortError(reason)) {
    logRawError(
      "[proxy] Agno SSE 流中断（兜底捕获，原始错误，进程继续运行）",
      reason,
    )
    return
  }
  logRawError("[proxy] 未处理的 Promise 拒绝（原始错误）", reason)
})

const runtime = new CopilotRuntime({
  agents: {
    default: new AgnoAgent({
      url: AGNO_URL,
      headers: agnoHeaders,
      fetch: customFetch,
    }),
  },
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
  res.json({
    ok: true,
    proxy: "agno-agui",
    agnoUrl: AGNO_URL,
    agentCode: AGENT_CODE,
    hasToken: !!AGNO_TOKEN,
    authRequired: true,
  })
})

app.listen(PORT, () => {
  console.log(`Agno 代理运行于 http://localhost:${PORT}`)
  console.log(`AG-UI 端点: ${AGNO_URL}`)
  console.log(`Agent Code: ${AGENT_CODE}`)
  if (!AGNO_TOKEN) {
    console.warn(
      "⚠️  未配置 AGNO_JWT_TOKEN。请从 kdl-agent 全局配置复制 agno_jwt_token。",
    )
  }
})
