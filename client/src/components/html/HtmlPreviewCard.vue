<script setup lang="ts">
import { ref, watch } from "vue"
import HtmlPreviewFrame from "./HtmlPreviewFrame.vue"

const props = withDefaults(
  defineProps<{
    title?: string
    html?: string | null
    allowScripts?: boolean
    height?: number
    complete?: boolean
  }>(),
  {
    title: "HTML 预览",
    html: "",
    allowScripts: true,
    height: 280,
    complete: true,
  },
)

const view = ref<"preview" | "code">(props.complete ? "preview" : "code")
const wasComplete = ref(props.complete)
const codeRef = ref<HTMLElement | null>(null)

watch(
  () => props.complete,
  (complete) => {
    if (!complete) {
      view.value = "code"
    } else if (!wasComplete.value) {
      view.value = "preview"
    }
    wasComplete.value = complete
  },
)

watch([() => props.html, view, () => props.complete], () => {
  if (view.value !== "code" || props.complete) return
  const el = codeRef.value
  if (el) el.scrollTop = el.scrollHeight
})
</script>

<template>
  <div class="gen-card html-preview-card">
    <div class="html-preview-header">
      <h4>🌐 {{ title }}<template v-if="!complete"> · 生成中</template></h4>
      <div class="html-preview-tabs">
        <button
          type="button"
          :class="{ active: view === 'preview' }"
          :disabled="!complete"
          @click="view = 'preview'"
        >
          预览
        </button>
        <button
          type="button"
          :class="{ active: view === 'code' }"
          @click="view = 'code'"
        >
          源码
        </button>
      </div>
    </div>

    <pre
      v-if="view === 'code'"
      ref="codeRef"
      class="html-preview-code"
    >{{ html || "⏳ 正在生成 HTML…" }}</pre>
    <HtmlPreviewFrame
      v-else
      :html="html"
      :title="title"
      :height="height"
      :allow-scripts="allowScripts"
    />
  </div>
</template>
