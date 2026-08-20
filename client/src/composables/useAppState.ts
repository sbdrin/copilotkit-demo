import { ref } from "vue"
import type { UserInfo, FormSubmission } from "../types"
import { INITIAL_USER } from "../types"

export function useAppState() {
  const submissions = ref<FormSubmission[]>([])
  const user = ref<UserInfo>({ ...INITIAL_USER })
  const chatMode = ref<"sidebar" | "popup">("sidebar")

  function addSubmission(
    type: FormSubmission["type"],
    title: string,
    summary: string,
    data: Record<string, unknown>,
  ) {
    submissions.value = [
      {
        id: Date.now(),
        type,
        title,
        summary,
        data,
        createdAt: new Date().toLocaleString("zh-CN"),
      },
      ...submissions.value,
    ]
  }

  return {
    submissions,
    user,
    chatMode,
    addSubmission,
  }
}
