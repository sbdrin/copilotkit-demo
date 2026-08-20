<script setup lang="ts">
import { computed, ref } from "vue"
import HtmlPreviewCard from "./HtmlPreviewCard.vue"
import HtmlPreviewFrame from "./HtmlPreviewFrame.vue"

const props = defineProps<{
  status: string
  args?: { title?: string; html?: string }
  respond?: (result: unknown) => Promise<void>
}>()

const title = ref(props.args?.title ?? "我的页面")
const html = ref(
  props.args?.html ?? "<h1>Hello</h1><p>编辑左侧 HTML，右侧实时预览</p>",
)
const error = ref<string | null>(null)

const canRespond = computed(
  () => props.status === "executing" && typeof props.respond === "function",
)

function handleSubmit() {
  const trimmed = html.value.trim()
  if (!trimmed) {
    error.value = "请填写 HTML 内容后再提交"
    return
  }
  error.value = null
  if (!canRespond.value || !props.respond) return
  props.respond({ submitted: true, title: title.value, html: trimmed })
}

function handleCancel() {
  if (!canRespond.value || !props.respond) return
  props.respond({ submitted: false, reason: "用户取消" })
}
</script>

<template>
  <div v-if="status === 'complete'" class="html-editor-done">
    <p class="hitl-form-sub">✅ HTML 已提交</p>
    <HtmlPreviewCard :title="title" :html="html" :height="200" />
  </div>
  <div v-else class="gen-card html-preview-card html-editor-card">
    <h4>✏️ 编辑 HTML 并预览</h4>
    <p v-if="!canRespond" class="hitl-form-sub">
      ⏳ 编辑器加载中，稍候即可提交…
    </p>
    <label class="html-editor-title">
      标题
      <input v-model="title" placeholder="页面标题" />
    </label>
    <div class="html-editor-split">
      <label class="html-editor-code">
        HTML 源码
        <textarea
          v-model="html"
          rows="10"
          spellcheck="false"
          @input="error = null"
        />
      </label>
      <div class="html-editor-preview-pane">
        <HtmlPreviewFrame :html="html" :title="title" :height="220" />
      </div>
    </div>
    <p v-if="error" class="hitl-form-error">{{ error }}</p>
    <div class="hitl-form-actions">
      <button
        type="button"
        class="btn-primary"
        :disabled="!canRespond"
        @click="handleSubmit"
      >
        {{ canRespond ? "提交 HTML" : "准备中…" }}
      </button>
      <button
        type="button"
        class="btn-ghost"
        :disabled="!canRespond"
        @click="handleCancel"
      >
        取消
      </button>
    </div>
  </div>
</template>
