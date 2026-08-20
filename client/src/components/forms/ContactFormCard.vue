<script setup lang="ts">
import { inject, ref } from "vue"
import HitlFormShell from "./HitlFormShell.vue"
import type { CopilotDemoContext } from "../../types"

const props = defineProps<{
  status: string
  args?: { name?: string; message?: string }
  respond?: (result: unknown) => Promise<void>
}>()

const demo = inject<CopilotDemoContext>("copilotDemo")

const name = ref(props.args?.name ?? "")
const phone = ref("")
const company = ref("")
const message = ref(props.args?.message ?? "")

function submit() {
  const data = {
    name: name.value,
    phone: phone.value,
    company: company.value,
    message: message.value,
  }
  demo?.addSubmission(
    "contact",
    `联系 · ${data.name}`,
    data.message.slice(0, 50),
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
    title="📇 联系信息"
    subtitle="Agent 已预填部分字段，你可以修改后提交"
    :status="status"
    done-message="联系信息已提交"
    @submit="submit"
    @cancel="cancel"
  >
    <label>
      姓名
      <input v-model="name" placeholder="张三" required />
    </label>
    <label>
      手机号
      <input v-model="phone" placeholder="13800000000" required />
    </label>
    <label>
      公司
      <input v-model="company" placeholder="可选" />
    </label>
    <label>
      需求说明
      <textarea
        v-model="message"
        placeholder="请描述你的需求…"
        rows="3"
        required
      />
    </label>
  </HitlFormShell>
</template>
