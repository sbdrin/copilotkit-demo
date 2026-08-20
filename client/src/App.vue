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
import TodoItem from "./components/TodoItem.vue"
import HtmlPreviewCard from "./components/html/HtmlPreviewCard.vue"
import ReasoningMessage from "./components/ReasoningMessage.vue"
import type { CopilotChatLabels } from "@copilotkit/vue/v2"
import type { Todo } from "./types"
import "./components/App.css"

const FEATURES = [
  { icon: "💬", title: "Chat UI", desc: "CopilotSidebar + CopilotPopup 流式聊天" },
  { icon: "🖥", title: "Server Tools", desc: "后端 defineTool：天气、知识库、计算" },
  { icon: "⚡", title: "Frontend Tools", desc: "useFrontendTool 操作待办列表" },
  { icon: "📡", title: "Agent Context", desc: "useAgentContext 共享应用状态" },
  { icon: "🌐", title: "HTML 预览", desc: "iframe 沙箱实时预览" },
  { icon: "📎", title: "文件上传", desc: "聊天框支持图片/文档附件" },
  { icon: "🤝", title: "Human-in-the-Loop", desc: "useHumanInTheLoop 用户确认" },
  { icon: "💡", title: "Suggestions", desc: "useConfigureSuggestions 快捷建议" },
  { icon: "💭", title: "Thinking", desc: "思考过程弱化展示，结束后自动折叠" },
  { icon: "🔧", title: "Tool Calls", desc: "对话内展示工具调用与结果" },
  { icon: "🧠", title: "DeepSeek", desc: "OpenAI 兼容 API 接入" },
]

const state = useAppState()
const {
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
} = state

const { isReady } = useCopilotTools(state)

provide("copilotDemo", {
  addSubmission,
  addTodo: (todo: Todo) => {
    todos.value = [...todos.value, todo]
  },
  addHtmlPreview,
})

const chatLabels = {
  modalHeaderTitle: "DeepSeek 助手",
  chatInputToolbarAddButtonLabel: "添加附件",
} as unknown as Partial<CopilotChatLabels>

const sidebarLabels = {
  ...chatLabels,
  welcomeMessageText:
    "你好！支持上传图片和文档附件（点击输入框左侧 + 号），也能生成 HTML 预览、弹出表单。试试上传一张图片并问我里面有什么。",
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

      <main class="main">
        <div class="todo-panel">
          <div class="todo-header">
            <h2>待办事项</h2>
            <span class="todo-count">{{ completedCount }}/{{ todos.length }} 已完成</span>
          </div>

          <div class="todo-input-row">
            <input
              v-model="newTodo"
              placeholder="手动添加待办，或让 AI 帮你管理…"
              @keydown.enter="handleAdd()"
            />
            <button type="button" @click="handleAdd()">添加</button>
          </div>

          <ul class="todo-list">
            <TodoItem
              v-for="todo in todos"
              :key="todo.id"
              :todo="todo"
              @toggle="handleToggle"
              @remove="handleRemove"
            />
          </ul>

          <p v-if="todos.length === 0" class="empty-hint">
            暂无待办，试试对 AI 说「添加一个待办」
          </p>
        </div>

        <aside class="tips-panel">
          <h3>HTML 预览区</h3>
          <HtmlPreviewCard
            v-if="activePreview"
            :title="activePreview.title"
            :html="activePreview.html"
            :height="240"
          />
          <p v-else class="empty-hint">
            试试说「随便生成一个 HTML 示例」或「生成产品介绍 HTML」
          </p>

          <template v-if="htmlPreviews.length > 1">
            <h3 class="panel-subtitle">历史预览</h3>
            <ul class="submission-list">
              <li v-for="p in htmlPreviews" :key="p.id">
                <button
                  type="button"
                  class="preview-history-btn"
                  :class="{ active: p.id === activePreview?.id }"
                  @click="activePreviewId = p.id"
                >
                  {{ p.title }}
                  <time>{{ p.createdAt }}</time>
                </button>
              </li>
            </ul>
          </template>

          <h3 class="panel-subtitle">可交互表单</h3>
          <ul>
            <li>点击聊天框 + 号上传图片/文档</li>
            <li>「生成 HTML 页面并预览」→ iframe 预览</li>
            <li>「弹出 HTML 编辑器」→ 实时编辑预览</li>
            <li>「我想提交反馈」→ 聊天内表单</li>
          </ul>

          <h3 class="panel-subtitle">表单提交记录</h3>
          <p v-if="submissions.length === 0" class="empty-hint">
            暂无提交，试试让 AI 弹出表单
          </p>
          <ul v-else class="submission-list">
            <li v-for="s in submissions" :key="s.id" class="submission-item">
              <strong>{{ s.title }}</strong>
              <span>{{ s.summary }}</span>
              <time>{{ s.createdAt }}</time>
            </li>
          </ul>
        </aside>
      </main>

      <CopilotSidebar
        v-if="chatMode === 'sidebar'"
        default-open
        :attachments="CHAT_ATTACHMENTS"
        :labels="sidebarLabels"
      >
        <template #message-view="{ messages, isRunning }">
          <CopilotChatMessageView :messages="messages" :is-running="isRunning">
            <template #reasoning-message="slotProps">
              <ReasoningMessage v-bind="slotProps" />
            </template>
          </CopilotChatMessageView>
        </template>
      </CopilotSidebar>

      <CopilotPopup
        v-else
        :attachments="CHAT_ATTACHMENTS"
        :labels="popupLabels"
      >
        <template #message-view="{ messages, isRunning }">
          <CopilotChatMessageView :messages="messages" :is-running="isRunning">
            <template #reasoning-message="slotProps">
              <ReasoningMessage v-bind="slotProps" />
            </template>
          </CopilotChatMessageView>
        </template>
      </CopilotPopup>
  </div>
</template>
