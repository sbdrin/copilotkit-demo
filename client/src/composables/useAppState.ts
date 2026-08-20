import { ref, computed } from "vue"
import type {
  Todo,
  UserInfo,
  FormSubmission,
  HtmlPreviewItem,
} from "../types"
import { INITIAL_TODOS, INITIAL_USER } from "../types"

export function useAppState() {
  const todos = ref<Todo[]>([...INITIAL_TODOS])
  const submissions = ref<FormSubmission[]>([])
  const htmlPreviews = ref<HtmlPreviewItem[]>([])
  const activePreviewId = ref<number | null>(null)
  const user = ref<UserInfo>({ ...INITIAL_USER })
  const newTodo = ref("")
  const chatMode = ref<"sidebar" | "popup">("sidebar")

  const activePreview = computed(
    () =>
      htmlPreviews.value.find((p) => p.id === activePreviewId.value) ??
      htmlPreviews.value[0],
  )

  const completedCount = computed(
    () => todos.value.filter((t) => t.completed).length,
  )

  function addHtmlPreview(title: string, html: string) {
    const trimmed = html?.trim()
    if (!trimmed) return null
    const existing = htmlPreviews.value.find(
      (p) => p.title === title && p.html === trimmed,
    )
    if (existing) {
      activePreviewId.value = existing.id
      return existing
    }
    const item: HtmlPreviewItem = {
      id: Date.now(),
      title,
      html: trimmed,
      createdAt: new Date().toLocaleString("zh-CN"),
    }
    htmlPreviews.value = [item, ...htmlPreviews.value]
    activePreviewId.value = item.id
    return item
  }

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

  function handleAdd() {
    const text = newTodo.value.trim()
    if (!text) return
    todos.value = [
      ...todos.value,
      { id: Date.now(), text, completed: false, priority: "medium" },
    ]
    newTodo.value = ""
  }

  function handleToggle(id: number) {
    todos.value = todos.value.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t,
    )
  }

  function handleRemove(id: number) {
    todos.value = todos.value.filter((t) => t.id !== id)
  }

  return {
    todos,
    submissions,
    htmlPreviews,
    activePreviewId,
    user,
    newTodo,
    chatMode,
    activePreview,
    completedCount,
    addHtmlPreview,
    addSubmission,
    handleAdd,
    handleToggle,
    handleRemove,
  }
}
