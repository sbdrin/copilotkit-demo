<script setup lang="ts">
import type { Todo } from "../types"

defineProps<{
  todo: Todo
}>()

const emit = defineEmits<{
  toggle: [id: number]
  remove: [id: number]
}>()
</script>

<template>
  <li
    class="todo-item"
    :class="[`priority-${todo.priority}`, { done: todo.completed }]"
  >
    <label>
      <input
        type="checkbox"
        :checked="todo.completed"
        @change="emit('toggle', todo.id)"
      />
      <span>{{ todo.text }}</span>
    </label>
    <span class="priority-badge">{{ todo.priority }}</span>
    <button class="remove-btn" type="button" @click="emit('remove', todo.id)">
      ×
    </button>
  </li>
</template>
