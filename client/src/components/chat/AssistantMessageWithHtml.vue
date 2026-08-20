<script setup lang="ts">
import { computed } from "vue"
import type { AssistantMessage, Message } from "@ag-ui/core"
import { CopilotChatAssistantMessage } from "@copilotkit/vue/v2"
import HtmlPreviewCard from "../html/HtmlPreviewCard.vue"
import { extractHtmlFromAssistantContent } from "../../utils/htmlMessage"

const props = defineProps<{
  message: AssistantMessage
  messages: Message[]
  isRunning: boolean
}>()

const isLatestAssistant = computed(
  () => props.messages[props.messages.length - 1]?.id === props.message.id,
)

const streaming = computed(
  () => props.isRunning && isLatestAssistant.value,
)

const extracted = computed(() =>
  extractHtmlFromAssistantContent(props.message.content, streaming.value),
)

const showIframe = computed(() => extracted.value != null)
</script>

<template>
  <CopilotChatAssistantMessage
    v-if="!showIframe"
    :message="message"
    :messages="messages"
    :is-running="isRunning"
  />

  <CopilotChatAssistantMessage
    v-else
    :message="message"
    :messages="messages"
    :is-running="isRunning"
  >
    <template #message-renderer>
      <p
        v-if="extracted?.preamble"
        class="assistant-html-preamble"
      >
        {{ extracted.preamble }}
      </p>
      <HtmlPreviewCard
        title="HTML 预览"
        :html="extracted?.html ?? ''"
        :complete="extracted?.complete ?? false"
        :height="320"
      />
    </template>
  </CopilotChatAssistantMessage>
</template>

<style scoped>
.assistant-html-preamble {
  margin: 0 0 8px;
  font-size: 14px;
  color: #64748b;
}
</style>
