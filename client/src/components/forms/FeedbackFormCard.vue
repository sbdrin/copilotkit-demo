<script setup lang="ts">
import { inject, ref } from "vue"
import HitlFormShell from "./HitlFormShell.vue"
import type { CopilotDemoContext } from "../../types"

const props = defineProps<{
  status: string
  args?: { category?: string; comment?: string }
  respond?: (result: unknown) => Promise<void>
}>()

const demo = inject<CopilotDemoContext>("copilotDemo")

const category = ref(props.args?.category ?? "产品体验")
const rating = ref(5)
const email = ref("")
const comment = ref(props.args?.comment ?? "")

function submit() {
  const data = {
    category: category.value,
    rating: rating.value,
    email: email.value,
    comment: comment.value,
  }
  demo?.addSubmission(
    "feedback",
    `反馈 · ${data.category}`,
    `${data.rating} 星 · ${data.comment.slice(0, 40)}`,
    { ...data },
  )
  props.respond?.({ submitted: true, ...data })
}

function cancel() {
  props.respond?.({ submitted: false, reason: "用户取消" })
}
</script>

<template>
  <HitlFormShell
    title="📝 填写反馈"
    subtitle="请填写以下信息，提交后 Agent 会继续处理"
    :status="status"
    done-message="反馈已提交"
    @submit="submit"
    @cancel="cancel"
  >
    <label>
      反馈类型
      <select v-model="category">
        <option>产品体验</option>
        <option>功能建议</option>
        <option>Bug 报告</option>
        <option>其他</option>
      </select>
    </label>
    <label>
      评分
      <div class="rating-row">
        <button
          v-for="n in 5"
          :key="n"
          type="button"
          class="rating-btn"
          :class="{ active: rating >= n }"
          @click="rating = n"
        >
          ★
        </button>
      </div>
    </label>
    <label>
      邮箱
      <input v-model="email" type="email" placeholder="you@example.com" required />
    </label>
    <label>
      详细说明
      <textarea
        v-model="comment"
        placeholder="请描述你的反馈…"
        rows="3"
        required
      />
    </label>
  </HitlFormShell>
</template>
