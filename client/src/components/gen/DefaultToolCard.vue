<script setup lang="ts">
import { computed } from "vue"

const TOOL_STATUS_LABEL: Record<string, string> = {
  inProgress: "调用中…",
  executing: "执行中…",
  complete: "已完成",
}

const props = defineProps<{
  toolName: string
  args: Record<string, unknown>
  result?: unknown
  status: string
}>()

const statusLabel = computed(
  () =>
    TOOL_STATUS_LABEL[props.status] ??
    (props.status === "complete" ? "已完成" : props.status),
)

const isDone = computed(() => props.status === "complete")
</script>

<template>
  <details class="gen-card default-tool-card" :open="!isDone">
    <summary class="tool-call-summary">
      <span class="tool-call-name">🔧 {{ toolName }}</span>
      <span class="tool-status-badge" :class="isDone ? 'done' : 'running'">
        {{ statusLabel }}
      </span>
    </summary>
    <pre v-if="Object.keys(args).length > 0" class="tool-pre">{{
      JSON.stringify(args, null, 2)
    }}</pre>
    <pre v-if="result != null" class="tool-pre tool-result">{{
      typeof result === "string" ? result : JSON.stringify(result, null, 2)
    }}</pre>
  </details>
</template>
