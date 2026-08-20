import { computed, h, watch } from "vue"
import {
  useAgent,
  useCopilotKit,
  useAgentContext,
  useFrontendTool,
  useHumanInTheLoop,
  useConfigureSuggestions,
  useDefaultRenderTool,
} from "@copilotkit/vue/v2"
import type { VueHumanInTheLoopRenderProps } from "@copilotkit/vue/v2"
import { CopilotKitCoreRuntimeConnectionStatus } from "@copilotkit/core"
import { z } from "zod"
import type { Todo } from "../types"
import { parseToolResult } from "../utils"
import WeatherCard from "../components/gen/WeatherCard.vue"
import TaskStatsCard from "../components/gen/TaskStatsCard.vue"
import DefaultToolCard from "../components/gen/DefaultToolCard.vue"
import SyncedHtmlPreviewCard from "../components/html/SyncedHtmlPreviewCard.vue"
import TimePickerCard from "../components/hitl/TimePickerCard.vue"
import FeedbackFormCard from "../components/forms/FeedbackFormCard.vue"
import ContactFormCard from "../components/forms/ContactFormCard.vue"
import TodoFormCard from "../components/forms/TodoFormCard.vue"
import HtmlEditorPreviewCard from "../components/html/HtmlEditorPreviewCard.vue"
import type { useAppState } from "./useAppState"
import {
  calculateExpression,
  generateProductHtml,
  queryWeather,
  searchKnowledge,
} from "../tools/demo-tools"

const TIME_SLOTS = [
  { label: "明天 10:00", iso: "2026-08-19T10:00:00+08:00" },
  { label: "明天 14:00", iso: "2026-08-19T14:00:00+08:00" },
  { label: "后天 09:00", iso: "2026-08-20T09:00:00+08:00" },
  { label: "后天 15:30", iso: "2026-08-20T15:30:00+08:00" },
]

type AppState = ReturnType<typeof useAppState>

const DEFAULT_AGENT_ID = "default"

export function useCopilotTools(state: AppState) {
  const { copilotkit } = useCopilotKit()
  const { agent } = useAgent({ agentId: DEFAULT_AGENT_ID })
  const isReady = computed(() => agent.value != null)

  useAgentContext({
    description: "当前登录用户信息",
    value: computed(() => ({
      name: state.user.value.name,
      role: state.user.value.role,
      theme: state.user.value.theme,
    })),
  })

  useAgentContext({
    description: "用户的待办事项列表，包含完成状态和优先级",
    value: computed(() =>
      state.todos.value.map((t, i) => ({
        position: i + 1,
        id: t.id,
        text: t.text,
        completed: t.completed,
        priority: t.priority,
      })),
    ),
  })

  useAgentContext({
    description: "用户通过可交互表单提交的记录（反馈、联系、待办）",
    value: computed(() =>
      state.submissions.value.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        summary: s.summary,
        createdAt: s.createdAt,
      })),
    ),
  })

  useAgentContext({
    description: "用户 HTML 预览记录",
    value: computed(() =>
      state.htmlPreviews.value.map((p) => ({
        id: p.id,
        title: p.title,
        createdAt: p.createdAt,
      })),
    ),
  })

  useConfigureSuggestions({
    suggestions: [
      {
        title: "随机HTML",
        message: "随便生成一个创意 HTML 页面示例并预览，不要用固定模板",
      },
      { title: "产品介绍", message: "生成一个产品介绍的 HTML 页面并预览" },
      { title: "编辑 HTML", message: "弹出 HTML 编辑器，让我自己写代码并预览" },
      {
        title: "联系销售",
        message: "我想联系销售了解 CopilotKit 企业版，请让我填表",
      },
      { title: "添加待办", message: "帮我创建待办，弹出表单让我确认内容" },
      { title: "查询天气", message: "帮我查一下北京的天气" },
      {
        title: "预约会议",
        message: "帮我预约一个关于 CopilotKit 的技术分享会议",
      },
    ],
    available: "always",
  })

  // useConfigureSuggestions 首次 reload 时 CopilotChat 的 agent 可能尚未注册，
  // 静态 suggestions 不会被写入 core；在 agent / runtime 就绪后补一次 reload。
  const reloadSuggestions = () => {
    copilotkit.value.reloadSuggestions(DEFAULT_AGENT_ID)
  }

  watch(
    () => copilotkit.value.getAgent(DEFAULT_AGENT_ID),
    (registeredAgent) => {
      if (registeredAgent) reloadSuggestions()
    },
    { immediate: true },
  )

  watch(
    () => copilotkit.value.runtimeConnectionStatus,
    (status) => {
      if (status === CopilotKitCoreRuntimeConnectionStatus.Connected) {
        reloadSuggestions()
      }
    },
  )

  useFrontendTool({
    name: "addTodo",
    description: "添加一条待办事项",
    parameters: z.object({
      text: z.string().describe("待办内容"),
      priority: z
        .enum(["low", "medium", "high"])
        .default("medium")
        .describe("优先级"),
    }),
    handler: async ({ text, priority }) => {
      const todo: Todo = {
        id: Date.now(),
        text,
        completed: false,
        priority: priority ?? "medium",
      }
      state.todos.value = [...state.todos.value, todo]
      return `已添加待办：「${text}」（${priority}）`
    },
  })

  useFrontendTool({
    name: "toggleTodo",
    description: "切换待办事项的完成状态，可通过 id 或文本匹配",
    parameters: z.object({
      identifier: z.string().describe("待办 id 或文本关键词"),
    }),
    handler: async ({ identifier }) => {
      let found = false
      state.todos.value = state.todos.value.map((t) => {
        const match =
          String(t.id) === identifier ||
          t.text.toLowerCase().includes(identifier.toLowerCase())
        if (match) {
          found = true
          return { ...t, completed: !t.completed }
        }
        return t
      })
      return found
        ? `已切换待办「${identifier}」的状态`
        : `未找到待办：${identifier}`
    },
  })

  useFrontendTool({
    name: "removeTodo",
    description: "删除一条待办事项",
    parameters: z.object({
      identifier: z.string().describe("待办 id 或文本关键词"),
    }),
    handler: async ({ identifier }) => {
      const before = state.todos.value.length
      state.todos.value = state.todos.value.filter(
        (t) =>
          String(t.id) !== identifier &&
          !t.text.toLowerCase().includes(identifier.toLowerCase()),
      )
      return before > state.todos.value.length
        ? "已删除匹配的待办"
        : `未找到待办：${identifier}`
    },
  })

  useFrontendTool(
    {
      name: "showTaskStats",
      description: "显示当前待办任务的统计卡片",
      parameters: z.object({}),
      handler: async () => "已展示任务统计",
      render: () => {
        const completed = state.todos.value.filter((t) => t.completed).length
        return h(TaskStatsCard, {
          total: state.todos.value.length,
          completed,
          pending: state.todos.value.length - completed,
          highPriority: state.todos.value.filter((t) => t.priority === "high")
            .length,
        })
      },
    },
    [state.todos],
  )

  useFrontendTool({
    name: "getWeather",
    description: "查询指定城市的当前天气",
    parameters: z.object({
      city: z.string().describe("城市名称，如：北京、上海"),
    }),
    handler: async ({ city }) => queryWeather(city),
    render: ({ args, result, status }: any) => {
      if (status !== "complete" || !result) {
        return h("div", { class: "gen-card loading-card" }, [
          `⏳ 正在查询 ${args?.city ?? "..."} 的天气…`,
        ])
      }
      const data = parseToolResult<{
        city: string
        temperature: number
        unit?: string
        condition: string
        humidity?: string
      }>(result)
      if (typeof data === "string") {
        return h("div", { class: "gen-card" }, data)
      }
      return h(WeatherCard, data)
    },
  })

  useFrontendTool({
    name: "searchKnowledge",
    description: "搜索内置知识库，获取 CopilotKit 功能说明",
    parameters: z.object({
      query: z.string().describe("搜索关键词"),
    }),
    handler: async ({ query }) => searchKnowledge(query),
    render: ({ args, result, status }: any) => {
      const parsed = result ? parseToolResult<{ result: string }>(result) : null
      const text = typeof parsed === "string" ? parsed : parsed?.result
      return h("div", { class: "gen-card knowledge-card" }, [
        h("h4", "📚 知识库搜索"),
        h("p", `查询：${args?.query ?? ""}`),
        status === "complete" && text
          ? h("p", { class: "knowledge-result" }, text)
          : h("p", "搜索中…"),
      ])
    },
  })

  useFrontendTool({
    name: "calculate",
    description: "执行数学表达式计算",
    parameters: z.object({
      expression: z.string().describe("数学表达式，如：2+3*4"),
    }),
    handler: async ({ expression }) => calculateExpression(expression),
  })

  useDefaultRenderTool({
    render: ({
      name,
      parameters,
      result,
      status,
    }: {
      name: string
      parameters: unknown
      result?: string
      status: string
    }) =>
      h(DefaultToolCard, {
        toolName: name,
        args: parameters as Record<string, unknown>,
        result: result ? parseToolResult(result) : undefined,
        status,
      }),
  })

  useFrontendTool({
    name: "showHtmlPreview",
    description:
      "展示你自行编写的 HTML 预览（iframe）。这是「生成 HTML / HTML 示例 / 随机创意页面」的默认路径：先自己写 html 字符串，再调用本工具。禁止用于产品介绍模板场景（那种才用 generateHtml）；也不要与 generateHtml 同时调用。",
    parameters: z.object({
      title: z.string().describe("预览标题"),
      html: z.string().describe("你自行创作的 HTML 内容（片段或完整文档）"),
    }),
    handler: async () => "已展示 HTML 预览",
    render: ({ args, status }: any) => {
      const title = args?.title ?? "HTML 预览"
      const html = args?.html ?? ""
      const isComplete = status === "complete"
      return h(SyncedHtmlPreviewCard, {
        title,
        html,
        complete: isComplete,
        onSync: state.addHtmlPreview,
      })
    },
  })

  useFrontendTool({
    name: "generateHtml",
    description:
      "【仅限产品介绍】用固定模板生成「产品介绍」类 HTML 并自动预览。仅当用户明确要求「产品介绍」「产品落地页」「产品宣传页」时才调用。普通「生成 HTML / HTML 示例 / 随便写个页面」禁止调用本工具，应自行编写 HTML 后调用 showHtmlPreview。",
    parameters: z.object({
      template: z
        .enum(["landing", "dashboard", "card"])
        .describe("产品介绍模板类型：landing 落地页、dashboard 数据看板、card 产品卡片"),
      title: z.string().optional().describe("产品/页面标题"),
    }),
    handler: async ({ template, title }) =>
      generateProductHtml(template, title),
    render: ({ args, result, status }: any) => {
      const isComplete = status === "complete"
      if (!isComplete || !result) {
        return h(SyncedHtmlPreviewCard, {
          title: args?.title ?? `CopilotKit ${args?.template ?? ""} 预览`,
          html: "",
          complete: false,
          onSync: state.addHtmlPreview,
        })
      }
      const data = parseToolResult<{ title: string; html: string }>(result)
      if (typeof data === "string" || !data?.html) {
        return h(
          "div",
          { class: "gen-card" },
          typeof data === "string" ? data : "HTML 生成失败",
        )
      }
      return h(SyncedHtmlPreviewCard, {
        title: data.title,
        html: data.html,
        complete: true,
        onSync: state.addHtmlPreview,
      })
    },
  })

  useHumanInTheLoop({
    name: "editHtmlPreview",
    description:
      "弹出 HTML 编辑器，左侧编辑源码、右侧 iframe 实时预览，用户提交后保存。",
    parameters: z.object({
      title: z.string().optional().describe("预填页面标题"),
      html: z.string().optional().describe("预填 HTML 内容"),
    }),
    render: (props: any) => h(HtmlEditorPreviewCard, props),
  })

  useHumanInTheLoop({
    name: "collectFeedback",
    description:
      "弹出可交互反馈表单，让用户填写评分、邮箱和详细说明。用户提交表单后才能继续。",
    parameters: z.object({
      category: z.string().optional().describe("预填的反馈类型"),
      comment: z.string().optional().describe("预填的反馈内容草稿"),
    }),
    render: (props: any) => h(FeedbackFormCard, props),
  })

  useHumanInTheLoop({
    name: "fillContactForm",
    description:
      "弹出联系信息表单（姓名、手机、公司、需求）。用于销售咨询、商务合作等场景。",
    parameters: z.object({
      name: z.string().optional().describe("预填姓名"),
      message: z.string().optional().describe("预填需求说明"),
    }),
    render: (props: any) => h(ContactFormCard, props),
  })

  useHumanInTheLoop({
    name: "createTodoWithForm",
    description:
      "弹出待办创建表单，让用户确认/修改内容后提交。比直接 addTodo 更适合需要用户确认的场景。",
    parameters: z.object({
      text: z.string().optional().describe("预填的待办内容"),
      priority: z
        .enum(["low", "medium", "high"])
        .optional()
        .describe("预填优先级"),
    }),
    render: (props: any) => h(TodoFormCard, props),
  })

  useHumanInTheLoop({
    name: "scheduleMeeting",
    description: "预约会议，需要用户从候选时间段中选择一个。用于重要日程安排。",
    parameters: z.object({
      topic: z.string().describe("会议主题"),
      attendee: z.string().optional().describe("参会人"),
    }),
    render: (props: VueHumanInTheLoopRenderProps<{ topic: string; attendee?: string }>) =>
      h(TimePickerCard, {
        topic: props.args?.topic ?? "会议",
        attendee: props.args?.attendee,
        slots: TIME_SLOTS,
        status: props.status,
        respond: props.respond,
      }),
  })

  return { isReady }
}
