<script setup lang="ts">
import { provide } from "vue"
import {
  CopilotSidebar,
  CopilotPopup,
  CopilotChatMessageView,
} from "@copilotkit/vue/v2"
import { useAppState } from "./composables/useAppState"
import { useCopilotTools } from "./composables/useCopilotTools"
import { CHAT_ATTACHMENTS } from "./attachments"
import ReasoningMessage from "./components/ReasoningMessage.vue"
import AssistantMessageWithHtml from "./components/chat/AssistantMessageWithHtml.vue"
import type { CopilotChatLabels } from "@copilotkit/vue/v2"
import "./components/App.css"

const FEATURES = [
  { icon: "💬", title: "Chat UI", desc: "CopilotSidebar + CopilotPopup 流式聊天" },
  { icon: "🖥", title: "Server Tools", desc: "后端 defineTool：天气、知识库、计算" },
  { icon: "📡", title: "Agent Context", desc: "useAgentContext 共享应用状态" },
  { icon: "📎", title: "文件上传", desc: "聊天框支持图片/文档附件" },
  { icon: "🤝", title: "Human-in-the-Loop", desc: "useHumanInTheLoop 用户确认" },
  { icon: "💡", title: "Suggestions", desc: "useConfigureSuggestions 快捷建议" },
  { icon: "💭", title: "Thinking", desc: "思考过程弱化展示，结束后自动折叠" },
  { icon: "🔧", title: "Tool Calls", desc: "对话内展示工具调用与结果" },
  { icon: "🧠", title: "DeepSeek", desc: "OpenAI 兼容 API 接入" },
]

const state = useAppState()
const { submissions, user, chatMode, addSubmission } = state

const { isReady } = useCopilotTools(state)

provide("copilotDemo", {
  addSubmission,
})

const chatLabels = {
  modalHeaderTitle: "DeepSeek 助手",
  chatInputToolbarAddButtonLabel: "添加附件",
} as unknown as Partial<CopilotChatLabels>

const sidebarLabels = {
  ...chatLabels,
  welcomeMessageText:
    "你好！支持上传图片和文档附件（点击输入框左侧 + 号），也能弹出表单。试试上传一张图片并问我里面有什么。",
} as unknown as Partial<CopilotChatLabels>

const popupLabels = {
  ...chatLabels,
  welcomeMessageText: "你好！点击输入框开始对话。",
} as unknown as Partial<CopilotChatLabels>
</script>

<template>
  <div class="app">
    <header class="header">
      <div>
        <h1>CopilotKit 全功能演示</h1>
        <p class="subtitle">Vue 3 + DeepSeek · 点击右下角打开 AI 助手</p>
      </div>
      <div class="header-actions">
        <select v-model="chatMode">
          <option value="sidebar">侧边栏模式</option>
          <option value="popup">弹窗模式</option>
        </select>
        <span class="user-badge">
          {{ user.name }} · {{ user.role }}
          <span class="agent-status" :class="{ ready: isReady }">
            {{ isReady ? " · Agent 就绪" : " · 连接中…" }}
          </span>
        </span>
      </div>
    </header>

    <section class="features">
      <div v-for="f in FEATURES" :key="f.title" class="feature-card">
        <span class="feature-icon">{{ f.icon }}</span>
        <strong>{{ f.title }}</strong>
        <span>{{ f.desc }}</span>
      </div>
    </section>

    <CopilotSidebar v-if="chatMode === 'sidebar'" default-open :attachments="CHAT_ATTACHMENTS" :labels="sidebarLabels">
      <template #message-view="{ messages, isRunning }">
        <CopilotChatMessageView :messages="messages" :is-running="isRunning">
          <template #assistant-message="slotProps">
            <AssistantMessageWithHtml v-bind="slotProps" />
          </template>
          <template #reasoning-message="slotProps">
            <ReasoningMessage v-bind="slotProps" />
          </template>
        </CopilotChatMessageView>
      </template>
    </CopilotSidebar>

    <CopilotPopup v-else :attachments="CHAT_ATTACHMENTS" :labels="popupLabels">
      <template #message-view="{ messages, isRunning }">
        <CopilotChatMessageView :messages="messages" :is-running="isRunning">
          <template #assistant-message="slotProps">
            <AssistantMessageWithHtml v-bind="slotProps" />
          </template>
          <template #reasoning-message="slotProps">
            <ReasoningMessage v-bind="slotProps" />
          </template>
        </CopilotChatMessageView>
      </template>
    </CopilotPopup>
  </div>
</template>
