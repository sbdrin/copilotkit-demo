import { useState, useCallback } from 'react'
import {
  CopilotSidebar,
  CopilotPopup,
  useAgent,
  useAgentContext,
  useFrontendTool,
  useHumanInTheLoop,
  useConfigureSuggestions,
  useRenderTool,
  useComponent,
  useDefaultRenderTool
} from '@copilotkit/react-core/v2'
import { z } from 'zod'
import type { Todo, UserInfo, FormSubmission, HtmlPreviewItem } from './types'
import { INITIAL_TODOS, INITIAL_USER } from './types'
import {
  WeatherCard,
  TaskStatsCard,
  TimePickerCard,
  DefaultToolCard,
  TodoItem,
  type TimeSlot
} from './components/Cards'
import {
  FeedbackFormCard,
  ContactFormCard,
  TodoFormCard
} from './components/Forms'
import {
  HtmlPreviewCard,
  HtmlEditorPreviewCard,
  SyncedHtmlPreviewCard
} from './components/HtmlPreview'
import './components/App.css'
import { parseToolResult } from './utils'
import { copilotChatConfig } from './copilot-chat-config'

const TIME_SLOTS: TimeSlot[] = [
  { label: '明天 10:00', iso: '2026-08-19T10:00:00+08:00' },
  { label: '明天 14:00', iso: '2026-08-19T14:00:00+08:00' },
  { label: '后天 09:00', iso: '2026-08-20T09:00:00+08:00' },
  { label: '后天 15:30', iso: '2026-08-20T15:30:00+08:00' }
]

const FEATURES = [
  {
    icon: '💬',
    title: 'Chat UI',
    desc: 'CopilotSidebar + CopilotPopup 流式聊天'
  },
  {
    icon: '🖥',
    title: 'Server Tools',
    desc: '后端 defineTool：天气、知识库、计算'
  },
  { icon: '⚡', title: 'Frontend Tools', desc: 'useFrontendTool 操作待办列表' },
  { icon: '📡', title: 'Agent Context', desc: 'useAgentContext 共享应用状态' },
  { icon: '🌐', title: 'HTML 预览', desc: 'iframe 沙箱实时预览' },
  { icon: '📎', title: '文件上传', desc: '聊天框支持图片/文档附件' },
  {
    icon: '🤝',
    title: 'Human-in-the-Loop',
    desc: 'useHumanInTheLoop 用户确认'
  },
  {
    icon: '💡',
    title: 'Suggestions',
    desc: 'useConfigureSuggestions 快捷建议'
  },
  { icon: '🧠', title: 'DeepSeek', desc: 'OpenAI 兼容 API 接入' }
]

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS)
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [htmlPreviews, setHtmlPreviews] = useState<HtmlPreviewItem[]>([])
  const [activePreviewId, setActivePreviewId] = useState<number | null>(null)
  const [user] = useState<UserInfo>(INITIAL_USER)
  const [newTodo, setNewTodo] = useState('')
  const [chatMode, setChatMode] = useState<'sidebar' | 'popup'>('sidebar')

  // ── useAgent：连接 Agent 实例（v2 核心 hook）────────────────
  const { isReady } = useAgent({ agentId: 'default' })

  // ── Agent Context（共享状态，v2 版 useCopilotReadable）──────────
  useAgentContext({
    description: '当前登录用户信息',
    value: { name: user.name, role: user.role, theme: user.theme }
  })

  useAgentContext({
    description: '用户的待办事项列表，包含完成状态和优先级',
    value: todos.map((t, i) => ({
      position: i + 1,
      id: t.id,
      text: t.text,
      completed: t.completed,
      priority: t.priority
    }))
  })

  useAgentContext({
    description: '用户通过可交互表单提交的记录（反馈、联系、待办）',
    value: submissions.map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      summary: s.summary,
      createdAt: s.createdAt
    }))
  })

  const addHtmlPreview = useCallback((title: string, html: string) => {
    const trimmed = html?.trim()
    if (!trimmed) return null
    let created: HtmlPreviewItem | null = null
    setHtmlPreviews((prev) => {
      if (prev.some((p) => p.title === title && p.html === trimmed)) {
        const existing = prev.find((p) => p.title === title && p.html === trimmed)!
        created = existing
        return prev
      }
      const item: HtmlPreviewItem = {
        id: Date.now(),
        title,
        html: trimmed,
        createdAt: new Date().toLocaleString('zh-CN')
      }
      created = item
      return [item, ...prev]
    })
    if (created) setActivePreviewId(created.id)
    return created
  }, [])

  const activePreview =
    htmlPreviews.find((p) => p.id === activePreviewId) ?? htmlPreviews[0]

  useAgentContext({
    description: '用户 HTML 预览记录',
    value: htmlPreviews.map((p) => ({
      id: p.id,
      title: p.title,
      createdAt: p.createdAt
    }))
  })

  const addSubmission = (
    type: FormSubmission['type'],
    title: string,
    summary: string,
    data: Record<string, unknown>
  ) => {
    setSubmissions((prev) => [
      {
        id: Date.now(),
        type,
        title,
        summary,
        data,
        createdAt: new Date().toLocaleString('zh-CN')
      },
      ...prev
    ])
  }

  // ── 快捷建议（Suggestions）────────────────────────────────────
  useConfigureSuggestions({
    suggestions: [
      { title: 'HTML 预览', message: '生成一个产品介绍的 HTML 页面并预览' },
      { title: '编辑 HTML', message: '弹出 HTML 编辑器，让我自己写代码并预览' },
      {
        title: '联系销售',
        message: '我想联系销售了解 CopilotKit 企业版，请让我填表'
      },
      { title: '添加待办', message: '帮我创建待办，弹出表单让我确认内容' },
      { title: '查询天气', message: '帮我查一下北京的天气' },
      {
        title: '预约会议',
        message: '帮我预约一个关于 CopilotKit 的技术分享会议'
      }
    ],
    available: 'always'
  })

  // ── 前端工具（Frontend Tools）──────────────────────────────────
  useFrontendTool({
    name: 'addTodo',
    description: '添加一条待办事项',
    parameters: z.object({
      text: z.string().describe('待办内容'),
      priority: z
        .enum(['low', 'medium', 'high'])
        .default('medium')
        .describe('优先级')
    }),
    handler: async ({ text, priority }) => {
      const todo: Todo = {
        id: Date.now(),
        text,
        completed: false,
        priority: priority ?? 'medium'
      }
      setTodos((prev) => [...prev, todo])
      return `已添加待办：「${text}」（${priority}）`
    }
  })

  useFrontendTool({
    name: 'toggleTodo',
    description: '切换待办事项的完成状态，可通过 id 或文本匹配',
    parameters: z.object({
      identifier: z.string().describe('待办 id 或文本关键词')
    }),
    handler: async ({ identifier }) => {
      let found = false
      setTodos((prev) =>
        prev.map((t) => {
          const match =
            String(t.id) === identifier ||
            t.text.toLowerCase().includes(identifier.toLowerCase())
          if (match) {
            found = true
            return { ...t, completed: !t.completed }
          }
          return t
        })
      )
      return found
        ? `已切换待办「${identifier}」的状态`
        : `未找到待办：${identifier}`
    }
  })

  useFrontendTool({
    name: 'removeTodo',
    description: '删除一条待办事项',
    parameters: z.object({
      identifier: z.string().describe('待办 id 或文本关键词')
    }),
    handler: async ({ identifier }) => {
      const before = todos.length
      setTodos((prev) =>
        prev.filter(
          (t) =>
            String(t.id) !== identifier &&
            !t.text.toLowerCase().includes(identifier.toLowerCase())
        )
      )
      const removed = before - todos.length
      return removed > 0 ? `已删除匹配的待办` : `未找到待办：${identifier}`
    }
  })

  // ── 生成式 UI：useComponent 注册 React 组件为工具 ─────────────
  useComponent(
    {
      name: 'showTaskStats',
      description: '显示当前待办任务的统计卡片',
      render: () => {
        const completed = todos.filter((t) => t.completed).length
        return (
          <TaskStatsCard
            total={todos.length}
            completed={completed}
            pending={todos.length - completed}
            highPriority={todos.filter((t) => t.priority === 'high').length}
          />
        )
      }
    },
    [todos]
  )

  // ── 生成式 UI：useRenderTool 渲染后端工具结果 ─────────────────
  useRenderTool({
    name: 'getWeather',
    parameters: z.object({ city: z.string() }),
    render: ({ parameters, result, status }) => {
      if (status !== 'complete' || !result) {
        return (
          <div className="gen-card loading-card">
            ⏳ 正在查询 {parameters.city ?? '...'} 的天气…
          </div>
        )
      }
      const data = parseToolResult<{
        city: string
        temperature: number
        unit?: string
        condition: string
        humidity?: string
      }>(result)
      if (typeof data === 'string') {
        return <div className="gen-card">{data}</div>
      }
      return <WeatherCard {...data} />
    }
  })

  useRenderTool({
    name: 'searchKnowledge',
    parameters: z.object({ query: z.string() }),
    render: ({ parameters, result, status }) => {
      const parsed = result ? parseToolResult<{ result: string }>(result) : null
      const text = typeof parsed === 'string' ? parsed : parsed?.result
      return (
        <div className="gen-card knowledge-card">
          <h4>📚 知识库搜索</h4>
          <p>查询：{parameters.query}</p>
          {status === 'complete' && text ? (
            <p className="knowledge-result">{text}</p>
          ) : (
            <p>搜索中…</p>
          )}
        </div>
      )
    }
  })

  // ── 默认工具渲染器（useDefaultRenderTool）──────────────────────
  useDefaultRenderTool({
    render: ({ name, parameters, result, status }) => (
      <DefaultToolCard
        toolName={name}
        args={parameters as Record<string, unknown>}
        result={result ? parseToolResult(result) : undefined}
        status={status}
      />
    )
  })

  // ── 生成式 UI：HTML 预览（useComponent）──────────────────────
  useComponent({
    name: 'showHtmlPreview',
    description:
      '在聊天中展示自定义 HTML 页面预览（iframe）。仅用于展示 Agent 自行编写的 HTML，不要与 generateHtml 同时调用（generateHtml 已自带预览）。',
    parameters: z.object({
      title: z.string().describe('预览标题'),
      html: z.string().describe('HTML 内容，可以是片段或完整文档')
    }),
    render: ({ title, html }) => {
      if (!(html ?? '').trim()) {
        return (
          <div className="gen-card loading-card">⏳ 正在准备 HTML 预览…</div>
        )
      }
      return (
        <SyncedHtmlPreviewCard
          title={title ?? 'HTML 预览'}
          html={html}
          onSync={addHtmlPreview}
        />
      )
    }
  })

  // ── 后端 generateHtml 工具结果渲染 ────────────────────────────
  useRenderTool({
    name: 'generateHtml',
    parameters: z.object({
      template: z.string(),
      title: z.string().optional()
    }),
    render: ({ parameters, result, status }) => {
      if (status !== 'complete' || !result) {
        return (
          <div className="gen-card loading-card">
            ⏳ 正在生成 HTML（{parameters.template}）…
          </div>
        )
      }
      const data = parseToolResult<{
        title: string
        html: string
      }>(result)
      if (typeof data === 'string' || !data?.html) {
        return (
          <div className="gen-card">
            {typeof data === 'string' ? data : 'HTML 生成失败'}
          </div>
        )
      }
      return (
        <SyncedHtmlPreviewCard
          title={data.title}
          html={data.html}
          onSync={addHtmlPreview}
        />
      )
    }
  })

  // ── 可交互 HTML 编辑器（HITL）────────────────────────────────
  useHumanInTheLoop({
    name: 'editHtmlPreview',
    description:
      '弹出 HTML 编辑器，左侧编辑源码、右侧 iframe 实时预览，用户提交后保存。',
    parameters: z.object({
      title: z.string().optional().describe('预填页面标题'),
      html: z.string().optional().describe('预填 HTML 内容')
    }),
    render: ({ args, status, respond }) => (
      <HtmlEditorPreviewCard
        status={status}
        defaultTitle={args?.title}
        defaultHtml={args?.html}
        respond={respond}
        onSync={addHtmlPreview}
      />
    )
  })

  // ── 可交互生成式 UI：反馈表单（useHumanInTheLoop）────────────
  useHumanInTheLoop({
    name: 'collectFeedback',
    description:
      '弹出可交互反馈表单，让用户填写评分、邮箱和详细说明。用户提交表单后才能继续。',
    parameters: z.object({
      category: z
        .string()
        .optional()
        .describe('预填的反馈类型，如：产品体验、功能建议'),
      comment: z.string().optional().describe('预填的反馈内容草稿')
    }),
    render: ({ args, status, respond }) => (
      <FeedbackFormCard
        status={status}
        defaultCategory={args?.category}
        defaultComment={args?.comment}
        onSubmit={(data) => {
          addSubmission(
            'feedback',
            `反馈 · ${data.category}`,
            `${data.rating} 星 · ${data.comment.slice(0, 40)}`,
            { ...data }
          )
          respond?.({ submitted: true, ...data })
        }}
        onCancel={() => respond?.({ submitted: false, reason: '用户取消' })}
      />
    )
  })

  // ── 可交互生成式 UI：联系表单 ─────────────────────────────────
  useHumanInTheLoop({
    name: 'fillContactForm',
    description:
      '弹出联系信息表单（姓名、手机、公司、需求）。用于销售咨询、商务合作等场景。',
    parameters: z.object({
      name: z.string().optional().describe('预填姓名'),
      message: z.string().optional().describe('预填需求说明')
    }),
    render: ({ args, status, respond }) => (
      <ContactFormCard
        status={status}
        defaultName={args?.name}
        defaultMessage={args?.message}
        onSubmit={(data) => {
          addSubmission(
            'contact',
            `联系 · ${data.name}`,
            data.message.slice(0, 50),
            { ...data }
          )
          respond?.({ submitted: true, ...data })
        }}
        onCancel={() => respond?.({ submitted: false, reason: '用户取消' })}
      />
    )
  })

  // ── 可交互生成式 UI：待办表单 ─────────────────────────────────
  useHumanInTheLoop({
    name: 'createTodoWithForm',
    description:
      '弹出待办创建表单，让用户确认/修改内容后提交。比直接 addTodo 更适合需要用户确认的场景。',
    parameters: z.object({
      text: z.string().optional().describe('预填的待办内容'),
      priority: z
        .enum(['low', 'medium', 'high'])
        .optional()
        .describe('预填优先级')
    }),
    render: ({ args, status, respond }) => (
      <TodoFormCard
        status={status}
        defaultText={args?.text}
        defaultPriority={args?.priority}
        onSubmit={(data) => {
          const todo: Todo = {
            id: Date.now(),
            text: data.text,
            completed: false,
            priority: data.priority,
            dueDate: data.dueDate || undefined
          }
          setTodos((prev) => [...prev, todo])
          addSubmission(
            'todo',
            `待办 · ${data.text}`,
            `${data.priority} 优先级${data.dueDate ? ` · 截止 ${data.dueDate}` : ''}`,
            { ...data }
          )
          respond?.({ submitted: true, todo })
        }}
        onCancel={() => respond?.({ submitted: false, reason: '用户取消' })}
      />
    )
  })

  // ── Human-in-the-Loop：会议预约 ───────────────────────────────
  useHumanInTheLoop({
    name: 'scheduleMeeting',
    description: '预约会议，需要用户从候选时间段中选择一个。用于重要日程安排。',
    parameters: z.object({
      topic: z.string().describe('会议主题'),
      attendee: z.string().optional().describe('参会人')
    }),
    render: ({ args, status, respond }) => (
      <TimePickerCard
        topic={args?.topic ?? '会议'}
        attendee={args?.attendee}
        slots={TIME_SLOTS}
        status={status}
        onSubmit={(result: { selected: TimeSlot; confirmed: boolean }) =>
          respond?.(result)
        }
      />
    )
  })

  // ── 手动操作 ──────────────────────────────────────────────────
  const handleAdd = () => {
    const text = newTodo.trim()
    if (!text) return
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), text, completed: false, priority: 'medium' }
    ])
    setNewTodo('')
  }

  const handleToggle = (id: number) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  const handleRemove = (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const completedCount = todos.filter((t) => t.completed).length

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>CopilotKit 全功能演示</h1>
          <p className="subtitle">React + DeepSeek · 点击右下角打开 AI 助手</p>
        </div>
        <div className="header-actions">
          <select
            value={chatMode}
            onChange={(e) => setChatMode(e.target.value as 'sidebar' | 'popup')}
          >
            <option value="sidebar">侧边栏模式</option>
            <option value="popup">弹窗模式</option>
          </select>
          <span className="user-badge">
            {user.name} · {user.role}
            <span className={`agent-status ${isReady ? 'ready' : ''}`}>
              {isReady ? ' · Agent 就绪' : ' · 连接中…'}
            </span>
          </span>
        </div>
      </header>

      <section className="features">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <span className="feature-icon">{f.icon}</span>
            <strong>{f.title}</strong>
            <span>{f.desc}</span>
          </div>
        ))}
      </section>

      <main className="main">
        <div className="todo-panel">
          <div className="todo-header">
            <h2>待办事项</h2>
            <span className="todo-count">
              {completedCount}/{todos.length} 已完成
            </span>
          </div>

          <div className="todo-input-row">
            <input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="手动添加待办，或让 AI 帮你管理…"
            />
            <button onClick={handleAdd}>添加</button>
          </div>

          <ul className="todo-list">
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onRemove={handleRemove}
              />
            ))}
          </ul>

          {todos.length === 0 && (
            <p className="empty-hint">暂无待办，试试对 AI 说「添加一个待办」</p>
          )}
        </div>

        <aside className="tips-panel">
          <h3>HTML 预览区</h3>
          {activePreview ? (
            <HtmlPreviewCard
              title={activePreview.title}
              html={activePreview.html}
              height={240}
            />
          ) : (
            <p className="empty-hint">
              试试说「生成产品介绍 HTML」或「弹出 HTML 编辑器」
            </p>
          )}

          {htmlPreviews.length > 1 && (
            <>
              <h3 className="panel-subtitle">历史预览</h3>
              <ul className="submission-list">
                {htmlPreviews.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`preview-history-btn ${p.id === activePreview?.id ? 'active' : ''}`}
                      onClick={() => setActivePreviewId(p.id)}
                    >
                      {p.title}
                      <time>{p.createdAt}</time>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3 className="panel-subtitle">可交互表单</h3>
          <ul>
            <li>点击聊天框 + 号上传图片/文档</li>
            <li>「生成 HTML 页面并预览」→ iframe 预览</li>
            <li>「弹出 HTML 编辑器」→ 实时编辑预览</li>
            <li>「我想提交反馈」→ 聊天内表单</li>
          </ul>

          <h3 className="panel-subtitle">表单提交记录</h3>
          {submissions.length === 0 ? (
            <p className="empty-hint">暂无提交，试试让 AI 弹出表单</p>
          ) : (
            <ul className="submission-list">
              {submissions.map((s) => (
                <li key={s.id} className="submission-item">
                  <strong>{s.title}</strong>
                  <span>{s.summary}</span>
                  <time>{s.createdAt}</time>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </main>

      {chatMode === 'sidebar' ? (
        <CopilotSidebar
          defaultOpen
          {...copilotChatConfig}
          labels={{
            ...copilotChatConfig.labels,
            welcomeMessageText:
              '你好！支持上传图片和文档附件（点击输入框左侧 + 号），也能生成 HTML 预览、弹出表单。试试上传一张图片并问我里面有什么。'
          }}
        />
      ) : (
        <CopilotPopup
          {...copilotChatConfig}
          labels={{
            ...copilotChatConfig.labels,
            welcomeMessageText: '你好！点击输入框开始对话。'
          }}
        />
      )}
    </div>
  )
}
