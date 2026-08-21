<script setup lang="ts">
import { inject, ref } from "vue"
import HitlFormShell from "./HitlFormShell.vue"
import type { CopilotDemoContext } from "../../types"

const props = defineProps<{
  status: string
  args?: {
    name?: string
    identifyTypeCode?: string
    identifyNumber?: string
    contactPhone?: string
    address?: string
    civilUavLicenseNo?: string
  }
  respond?: (result: unknown) => Promise<void>
}>()

const demo = inject<CopilotDemoContext>("copilotDemo")

const name = ref(props.args?.name ?? "")
const identifyTypeCode = ref(props.args?.identifyTypeCode ?? "1")
const identifyNumber = ref(props.args?.identifyNumber ?? "")
const contactPhone = ref(props.args?.contactPhone ?? "")
const address = ref(props.args?.address ?? "")
const civilUavLicenseNo = ref(props.args?.civilUavLicenseNo ?? "")

function submit() {
  const data = {
    name: name.value,
    identifyTypeCode: identifyTypeCode.value,
    identifyNumber: identifyNumber.value,
    contactPhone: contactPhone.value,
    address: address.value,
    civilUavLicenseNo: civilUavLicenseNo.value,
  }
  demo?.addSubmission(
    "operator",
    `操作员登记 · ${data.name}`,
    data.civilUavLicenseNo,
    { ...data },
  )
  props.respond?.({ submitted: true, ...data })
}

function cancel() {
  props.respond?.({ submitted: false, reason: "用户取消" })
}
</script>

<template>
  <HitlFormShell title="🛩 操作员登记" subtitle="请填写无人机操作员登记信息，提交后 Agent 会继续处理" :status="status" done-message="操作员登记信息已提交"
    submit-label="提交登记" @submit="submit" @cancel="cancel">
    <label>
      姓名
      <input v-model="name" placeholder="张三" required />
    </label>
    <label>
      证件类型
      <select v-model="identifyTypeCode">
        <option value="1">1 - 居民身份证</option>
        <option value="2">2 - 护照</option>
        <option value="3">3 - 军官证</option>
        <option value="4">4 - 港澳居民来往内地通行证</option>
        <option value="5">5 - 台湾居民来往内地通行证</option>
        <option value="9">9 - 其他</option>
      </select>
    </label>
    <label>
      证件号码
      <input v-model="identifyNumber" placeholder="请输入证件号码" required />
    </label>
    <label>
      联系电话
      <input v-model="contactPhone" placeholder="13800000000" required />
    </label>
    <label>
      常住地址
      <input v-model="address" placeholder="可选" />
    </label>
    <label>
      民用无人机执照编号
      <input v-model="civilUavLicenseNo" placeholder="如 UAV-XXXXX" required />
    </label>
  </HitlFormShell>
</template>
