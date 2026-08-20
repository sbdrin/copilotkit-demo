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
import OperatorFormCard from "../components/forms/OperatorFormCard.vue"
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
        title: "操作员登记",
        message: "我想进行无人机操作员登记，请让我填表",
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
    name: "fillOperatorForm",
    description:
      "弹出无人机操作员登记表单（姓名、证件类型代码、证件号码、联系电话、常住地址、民用无人机执照编号）。用于操作员登记场景。",
    parameters: z.object({
      name: z.string().optional().describe("预填姓名"),
      identifyTypeCode: z
        .string()
        .optional()
        .describe("预填证件类型代码，如 1-居民身份证"),
      identifyNumber: z.string().optional().describe("预填证件号码"),
      contactPhone: z.string().optional().describe("预填联系电话"),
      address: z.string().optional().describe("预填常住地址"),
      civilUavLicenseNo: z
        .string()
        .optional()
        .describe("预填民用无人机执照编号"),
    }),
    render: (props: any) => h(OperatorFormCard, props),
  })


  return { isReady }
}
