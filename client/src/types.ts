export interface Todo {
  id: number
  text: string
  completed: boolean
  priority: "low" | "medium" | "high"
  dueDate?: string
}

export interface UserInfo {
  name: string
  role: string
  theme: "light" | "dark"
}

export interface FormSubmission {
  id: number
  type: "feedback" | "contact" | "todo"
  title: string
  summary: string
  data: Record<string, unknown>
  createdAt: string
}

export interface HtmlPreviewItem {
  id: number
  title: string
  html: string
  createdAt: string
}

export const INITIAL_TODOS: Todo[] = [
  { id: 1, text: "了解 CopilotKit Chat UI", completed: true, priority: "low" },
  { id: 2, text: "试用前端工具添加待办", completed: false, priority: "medium" },
  { id: 3, text: "让 Agent 查询天气（后端工具）", completed: false, priority: "high" },
]

export const INITIAL_USER: UserInfo = {
  name: "演示用户",
  role: "开发者",
  theme: "light",
}
