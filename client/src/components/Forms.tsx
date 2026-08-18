import { useState, type FormEvent } from "react"
import type { Todo } from "../types"

type HitlStatus = string

interface HitlFormShellProps {
  title: string
  subtitle?: string
  status: HitlStatus
  doneMessage?: string
  children: React.ReactNode
  onSubmit: (e: FormEvent) => void
  onCancel?: () => void
  submitLabel?: string
}

function HitlFormShell({
  title,
  subtitle,
  status,
  doneMessage,
  children,
  onSubmit,
  onCancel,
  submitLabel = "提交",
}: HitlFormShellProps) {
  if (status === "complete") {
    return (
      <div className="gen-card hitl-form done">
        ✅ {doneMessage ?? "已提交"}
      </div>
    )
  }

  return (
    <form className="gen-card hitl-form" onSubmit={onSubmit}>
      <h4>{title}</h4>
      {subtitle && <p className="hitl-form-sub">{subtitle}</p>}
      <div className="hitl-form-fields">{children}</div>
      <div className="hitl-form-actions">
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            取消
          </button>
        )}
      </div>
    </form>
  )
}

export interface FeedbackFormData {
  category: string
  rating: number
  email: string
  comment: string
}

interface FeedbackFormCardProps {
  status: HitlStatus
  defaultCategory?: string
  defaultComment?: string
  onSubmit: (data: FeedbackFormData) => void
  onCancel?: () => void
}

/** 可交互反馈表单（HITL 生成式 UI） */
export function FeedbackFormCard({
  status,
  defaultCategory = "产品体验",
  defaultComment = "",
  onSubmit,
  onCancel,
}: FeedbackFormCardProps) {
  const [category, setCategory] = useState(defaultCategory)
  const [rating, setRating] = useState(5)
  const [email, setEmail] = useState("")
  const [comment, setComment] = useState(defaultComment)

  return (
    <HitlFormShell
      title="📝 填写反馈"
      subtitle="请填写以下信息，提交后 Agent 会继续处理"
      status={status}
      doneMessage="反馈已提交"
      onCancel={onCancel}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ category, rating, email, comment })
      }}
    >
      <label>
        反馈类型
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>产品体验</option>
          <option>功能建议</option>
          <option>Bug 报告</option>
          <option>其他</option>
        </select>
      </label>
      <label>
        评分
        <div className="rating-row">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`rating-btn ${rating >= n ? "active" : ""}`}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
        </div>
      </label>
      <label>
        邮箱
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </label>
      <label>
        详细说明
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="请描述你的反馈…"
          rows={3}
          required
        />
      </label>
    </HitlFormShell>
  )
}

export interface ContactFormData {
  name: string
  phone: string
  company: string
  message: string
}

interface ContactFormCardProps {
  status: HitlStatus
  defaultName?: string
  defaultMessage?: string
  onSubmit: (data: ContactFormData) => void
  onCancel?: () => void
}

/** 可交互联系表单（HITL 生成式 UI） */
export function ContactFormCard({
  status,
  defaultName = "",
  defaultMessage = "",
  onSubmit,
  onCancel,
}: ContactFormCardProps) {
  const [name, setName] = useState(defaultName)
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [message, setMessage] = useState(defaultMessage)

  return (
    <HitlFormShell
      title="📇 联系信息"
      subtitle="Agent 已预填部分字段，你可以修改后提交"
      status={status}
      doneMessage="联系信息已提交"
      onCancel={onCancel}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ name, phone, company, message })
      }}
    >
      <label>
        姓名
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="张三"
          required
        />
      </label>
      <label>
        手机号
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="13800000000"
          required
        />
      </label>
      <label>
        公司
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="可选"
        />
      </label>
      <label>
        需求说明
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="请描述你的需求…"
          rows={3}
          required
        />
      </label>
    </HitlFormShell>
  )
}

export interface TodoFormData {
  text: string
  priority: Todo["priority"]
  dueDate: string
}

interface TodoFormCardProps {
  status: HitlStatus
  defaultText?: string
  defaultPriority?: Todo["priority"]
  onSubmit: (data: TodoFormData) => void
  onCancel?: () => void
}

/** 可交互待办表单（HITL 生成式 UI） */
export function TodoFormCard({
  status,
  defaultText = "",
  defaultPriority = "medium",
  onSubmit,
  onCancel,
}: TodoFormCardProps) {
  const [text, setText] = useState(defaultText)
  const [priority, setPriority] = useState<Todo["priority"]>(defaultPriority)
  const [dueDate, setDueDate] = useState("")

  return (
    <HitlFormShell
      title="✅ 创建待办"
      subtitle="确认或修改后提交，将同步到左侧列表"
      status={status}
      doneMessage="待办已创建"
      onCancel={onCancel}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ text, priority, dueDate })
      }}
    >
      <label>
        待办内容
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="要写什么？"
          required
        />
      </label>
      <label>
        优先级
        <select
          value={priority}
          onChange={(e) =>
            setPriority(e.target.value as Todo["priority"])
          }
        >
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
        </select>
      </label>
      <label>
        截止日期
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </label>
    </HitlFormShell>
  )
}
