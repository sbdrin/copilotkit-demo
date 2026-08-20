<script setup lang="ts">
import { inject, ref } from "vue"
import HitlFormShell from "./HitlFormShell.vue"
import type { CopilotDemoContext, Todo } from "../../types"

const props = defineProps<{
  status: string
  args?: { text?: string; priority?: Todo["priority"] }
  respond?: (result: unknown) => Promise<void>
}>()

const demo = inject<CopilotDemoContext>("copilotDemo")

const text = ref(props.args?.text ?? "")
const priority = ref<Todo["priority"]>(props.args?.priority ?? "medium")
const dueDate = ref("")

function submit() {
  const data = { text: text.value, priority: priority.value, dueDate: dueDate.value }
  const todo: Todo = {
    id: Date.now(),
    text: data.text,
    completed: false,
    priority: data.priority,
    dueDate: data.dueDate || undefined,
  }
  demo?.addTodo(todo)
  demo?.addSubmission(
    "todo",
    `待办 · ${data.text}`,
    `${data.priority} 优先级${data.dueDate ? ` · 截止 ${data.dueDate}` : ""}`,
    { ...data },
  )
  props.respond?.({ submitted: true, todo })
}

function cancel() {
  props.respond?.({ submitted: false, reason: "用户取消" })
}
</script>

<template>
  <HitlFormShell
    title="✅ 创建待办"
    subtitle="确认或修改后提交，将同步到左侧列表"
    :status="status"
    done-message="待办已创建"
    @submit="submit"
    @cancel="cancel"
  >
    <label>
      待办内容
      <input v-model="text" placeholder="要写什么？" required />
    </label>
    <label>
      优先级
      <select v-model="priority">
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
      </select>
    </label>
    <label>
      截止日期
      <input v-model="dueDate" type="date" />
    </label>
  </HitlFormShell>
</template>
