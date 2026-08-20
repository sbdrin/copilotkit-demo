import { computed, h, watch } from "vue"
import {
  useAgent,
  useCopilotKit,
  useAgentContext,
  useConfigureSuggestions,
} from "@copilotkit/vue/v2"
import { CopilotKitCoreRuntimeConnectionStatus } from "@copilotkit/core"
import { useHumanInTheLoop } from "@copilotkit/vue/v2"
import { z } from "zod"
import ContactFormCard from "../components/forms/ContactFormCard.vue"
import type { useAppState } from "./useAppState"

type AppState = ReturnType<typeof useAppState>

const DEFAULT_AGENT_ID = "default"

export function useCopilotTools(state: AppState) {
  const { copilotkit } = useCopilotKit()
  const { agent } = useAgent({ agentId: DEFAULT_AGENT_ID })
  const isReady = computed(() => agent.value != null)

  useAgentContext({
    description: "当前登录用户信息",
    value: computed(() => ({
      name: state.user.value.name,
      role: state.user.value.role,
      theme: state.user.value.theme,
    })),
  })

  useConfigureSuggestions({
    suggestions: [
      {
        title: "随机HTML",
        message: "生成最简HTML示例，不要太丑",
      },
      {
        title: "联系销售",
        message: "我想联系销售了解 CopilotKit 企业版，请让我填表",
      }
    ],
    available: "always",
  })

  // useConfigureSuggestions 首次 reload 时 CopilotChat 的 agent 可能尚未注册，
  // 静态 suggestions 不会被写入 core；在 agent / runtime 就绪后补一次 reload。
  const reloadSuggestions = () => {
    copilotkit.value.reloadSuggestions(DEFAULT_AGENT_ID)
  }

  watch(
    () => copilotkit.value.getAgent(DEFAULT_AGENT_ID),
    (registeredAgent) => {
      if (registeredAgent) reloadSuggestions()
    },
    { immediate: true },
  )

  watch(
    () => copilotkit.value.runtimeConnectionStatus,
    (status) => {
      if (status === CopilotKitCoreRuntimeConnectionStatus.Connected) {
        reloadSuggestions()
      }
    },
  )

  useHumanInTheLoop({
    name: "fillContactForm",
    description:
      "弹出联系信息表单（姓名、手机、公司、需求）。用于销售咨询、商务合作等场景。",
    parameters: z.object({
      name: z.string().optional().describe("预填姓名"),
      message: z.string().optional().describe("预填需求说明"),
    }),
    render: (props: any) => h(ContactFormCard, props),
  })


  return { isReady }
}
