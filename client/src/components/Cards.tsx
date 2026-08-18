import type { Todo } from "../types"

interface WeatherCardProps {
  city: string
  temperature: number
  unit?: string
  condition: string
  humidity?: string
}

/** 生成式 UI：天气卡片（由 useRenderTool 渲染后端 getWeather 工具结果） */
export function WeatherCard({
  city,
  temperature,
  unit = "°C",
  condition,
  humidity,
}: WeatherCardProps) {
  return (
    <div className="gen-card weather-card">
      <div className="gen-card-icon">🌤</div>
      <div>
        <h4>{city}</h4>
        <p className="weather-temp">
          {temperature}
          {unit}
        </p>
        <p className="weather-meta">
          {condition}
          {humidity ? ` · 湿度 ${humidity}` : ""}
        </p>
      </div>
    </div>
  )
}

interface TaskStatsProps {
  total: number
  completed: number
  pending: number
  highPriority: number
}

/** 生成式 UI：任务统计卡片（由 useComponent 注册） */
export function TaskStatsCard({
  total,
  completed,
  pending,
  highPriority,
}: TaskStatsProps) {
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className="gen-card stats-card">
      <h4>📊 任务统计</h4>
      <div className="stats-grid">
        <div>
          <span className="stats-num">{total}</span>
          <span className="stats-label">总计</span>
        </div>
        <div>
          <span className="stats-num">{completed}</span>
          <span className="stats-label">已完成</span>
        </div>
        <div>
          <span className="stats-num">{pending}</span>
          <span className="stats-label">待办</span>
        </div>
        <div>
          <span className="stats-num">{highPriority}</span>
          <span className="stats-label">高优先级</span>
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${rate}%` }} />
      </div>
      <p className="stats-rate">完成率 {rate}%</p>
    </div>
  )
}

export interface TimeSlot {
  label: string
  iso: string
}

interface TimePickerCardProps {
  topic: string
  attendee?: string
  slots: TimeSlot[]
  status: string
  onSubmit: (result: { selected: TimeSlot; confirmed: boolean }) => void
}

/** Human-in-the-Loop：时间选择卡片 */
export function TimePickerCard({
  topic,
  attendee,
  slots,
  status,
  onSubmit,
}: TimePickerCardProps) {
  if (status === "complete") {
    return (
      <div className="gen-card hitl-card hitl-done">
        ✅ 已确认预约：{topic}
      </div>
    )
  }

  return (
    <div className="gen-card hitl-card">
      <h4>📅 请选择时间</h4>
      <p>
        主题：<strong>{topic}</strong>
        {attendee ? ` · 与 ${attendee}` : ""}
      </p>
      <div className="slot-list">
        {slots.map((slot) => (
          <button
            key={slot.iso}
            className="slot-btn"
            onClick={() => onSubmit({ selected: slot, confirmed: true })}
          >
            {slot.label}
          </button>
        ))}
      </div>
      <button
        className="slot-cancel"
        onClick={() =>
          onSubmit({
            selected: { label: "取消", iso: "" },
            confirmed: false,
          })
        }
      >
        取消
      </button>
    </div>
  )
}

interface DefaultToolCardProps {
  toolName: string
  args: Record<string, unknown>
  result?: unknown
  status: string
}

/** 默认工具渲染器：兜底展示未专门注册的工具调用 */
export function DefaultToolCard({
  toolName,
  args,
  result,
  status,
}: DefaultToolCardProps) {
  return (
    <div className="gen-card default-tool-card">
      <h4>🔧 {toolName}</h4>
      <p className="tool-status">状态：{status}</p>
      {Object.keys(args).length > 0 && (
        <pre className="tool-pre">{JSON.stringify(args, null, 2)}</pre>
      )}
      {result != null && (
        <pre className="tool-pre tool-result">
          {typeof result === "string"
            ? result
            : JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}

interface TodoItemProps {
  todo: Todo
  onToggle: (id: number) => void
  onRemove: (id: number) => void
}

export function TodoItem({ todo, onToggle, onRemove }: TodoItemProps) {
  return (
    <li className={`todo-item priority-${todo.priority} ${todo.completed ? "done" : ""}`}>
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
        <span>{todo.text}</span>
      </label>
      <span className="priority-badge">{todo.priority}</span>
      <button className="remove-btn" onClick={() => onRemove(todo.id)}>
        ×
      </button>
    </li>
  )
}
