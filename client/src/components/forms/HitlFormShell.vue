<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  status: string
  doneMessage?: string
  submitLabel?: string
}>()

defineEmits<{
  submit: [event: Event]
  cancel: []
}>()
</script>

<template>
  <div v-if="status === 'complete'" class="gen-card hitl-form done">
    ✅ {{ doneMessage ?? "已提交" }}
  </div>
  <form v-else class="gen-card hitl-form" @submit.prevent="$emit('submit', $event)">
    <h4>{{ title }}</h4>
    <p v-if="subtitle" class="hitl-form-sub">{{ subtitle }}</p>
    <div class="hitl-form-fields">
      <slot />
    </div>
    <div class="hitl-form-actions">
      <button type="submit" class="btn-primary">
        {{ submitLabel ?? "提交" }}
      </button>
      <button type="button" class="btn-ghost" @click="$emit('cancel')">
        取消
      </button>
    </div>
  </form>
</template>
