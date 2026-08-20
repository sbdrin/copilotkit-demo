<script setup lang="ts">
export interface TimeSlot {
  label: string
  iso: string
}

const props = defineProps<{
  topic: string
  attendee?: string
  slots: TimeSlot[]
  status: string
  respond?: (result: unknown) => Promise<void>
}>()

function submit(slot: TimeSlot) {
  props.respond?.({ selected: slot, confirmed: true })
}

function cancel() {
  props.respond?.({
    selected: { label: "取消", iso: "" },
    confirmed: false,
  })
}
</script>

<template>
  <div v-if="status === 'complete'" class="gen-card hitl-card hitl-done">
    ✅ 已确认预约：{{ topic }}
  </div>
  <div v-else class="gen-card hitl-card">
    <h4>📅 请选择时间</h4>
    <p>
      主题：<strong>{{ topic }}</strong
      ><template v-if="attendee"> · 与 {{ attendee }}</template>
    </p>
    <div class="slot-list">
      <button
        v-for="slot in slots"
        :key="slot.iso"
        type="button"
        class="slot-btn"
        @click="submit(slot)"
      >
        {{ slot.label }}
      </button>
    </div>
    <button type="button" class="slot-cancel" @click="cancel">取消</button>
  </div>
</template>
