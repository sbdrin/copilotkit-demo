/** Agno AG-UI 代理：补全必填字段、注入 agent_code、处理 SSE 流异常 */

export type AgnoRunMeta = { threadId: string; runId: string }

export function readRunMeta(bodyText?: string): AgnoRunMeta {
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

function patchAgnoBody(bodyText: string, agentCode: string): string {
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
    agent_code: agentCode,
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
    }
    if (json.message) return json.message
    if (json.code !== undefined) return `Agno 错误 code=${json.code}`
  } catch {
    // 非 JSON
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

function sseEvent(event: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
}

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
        console.error("[agno-proxy] SSE 流中断:", formatStreamError(err))
        if (!runErrorEmitted) {
          runErrorEmitted = true
          controller.enqueue(
            sseEvent({
              type: "RUN_ERROR",
              message: formatStreamError(err),
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

/** 创建 Agno 专用 fetch：补全 body、处理非 SSE 错误响应、包装 SSE 流 */
export function createAgnoFetch(
  agentCode: string,
  jwtToken?: string,
): typeof fetch {
  return async (input, init) => {
    let runMeta = readRunMeta(
      typeof init?.body === "string" ? init.body : undefined,
    )

    if (!jwtToken) {
      console.error("[agno-proxy] 缺少 AGNO_JWT_TOKEN")
      return agnoErrorResponse(
        "缺少 AGNO_JWT_TOKEN，请在 .env 中配置",
        "MISSING_JWT",
        runMeta,
      )
    }

    if (init?.body && typeof init.body === "string") {
      try {
        const patchedBody = patchAgnoBody(init.body, agentCode)
        init = { ...init, body: patchedBody }
        runMeta = readRunMeta(patchedBody)
        console.log("[agno-proxy] → agno", {
          threadId: runMeta.threadId,
          runId: runMeta.runId,
          agentCode,
        })
      } catch {
        // 解析失败保持原样转发
      }
    }

    let res: Response
    try {
      res = await fetch(input, init)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "无法连接 Agno AG-UI 端点"
      console.error("[agno-proxy] 连接失败:", message)
      return agnoErrorResponse(message, "AGNO_UNREACHABLE", runMeta)
    }

    const ct = res.headers.get("content-type") || ""
    console.log("[agno-proxy] ← agno", res.status, ct)

    if (!ct.includes("text/event-stream")) {
      const text = await res.text()
      const message = parseAgnoError(text, res.status)
      console.error("[agno-proxy] 非 SSE:", message, text.slice(0, 200))
      return agnoErrorResponse(message, `AGNO_HTTP_${res.status}`, runMeta)
    }

    return wrapSseResponse(res, runMeta)
  }
}
