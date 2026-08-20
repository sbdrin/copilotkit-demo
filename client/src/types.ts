export interface UserInfo {
  name: string
  role: string
  theme: "light" | "dark"
}

export interface FormSubmission {
  id: number
  type: "feedback" | "contact"
  title: string
  summary: string
  data: Record<string, unknown>
  createdAt: string
}

export const INITIAL_USER: UserInfo = {
  name: "演示用户",
  role: "开发者",
  theme: "light",
}

export interface CopilotDemoContext {
  addSubmission: (
    type: FormSubmission["type"],
    title: string,
    summary: string,
    data: Record<string, unknown>,
  ) => void
}
