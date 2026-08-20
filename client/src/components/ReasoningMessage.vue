<script setup lang="ts">
import { CopilotChatReasoningMessage } from "@copilotkit/vue/v2"
import type { Message, ReasoningMessage } from "@ag-ui/core"

defineProps<{
  message: ReasoningMessage
  messages?: Message[]
  isRunning?: boolean
}>()

function toZhLabel(label: string, isStreaming: boolean): string {
  if (isStreaming) return "思考中…"
  return label
    .replace(/^Thought for\s+/i, "已思考 ")
    .replace(/a few seconds/i, "片刻")
    .replace(/(\d+)\s*seconds?/i, "$1 秒")
    .replace(/(\d+)\s*minutes?/i, "$1 分钟")
    .replace(/(\d+)m\s+(\d+)s/i, "$1 分 $2 秒")
}
</script>

<template>
  <CopilotChatReasoningMessage
    class="reasoning-muted"
    :message="message"
    :messages="messages"
    :is-running="isRunning"
  >
    <template #header="{ isOpen, label, hasContent, isStreaming, onClick }">
      <CopilotChatReasoningMessage.Header
        :is-open="isOpen"
        :label="toZhLabel(label ?? '', !!isStreaming)"
        :has-content="hasContent"
        :is-streaming="isStreaming"
        class="reasoning-muted__header"
        @click="onClick"
      />
    </template>
    <template #content-view="{ isStreaming, hasContent }">
      <CopilotChatReasoningMessage.Content
        :is-streaming="isStreaming"
        :has-content="hasContent"
        class="reasoning-muted__content"
      >
        <slot />
      </CopilotChatReasoningMessage.Content>
    </template>
  </CopilotChatReasoningMessage>
</template>
