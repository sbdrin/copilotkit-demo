<script setup lang="ts">
defineProps<{
  total: number
  completed: number
  pending: number
  highPriority: number
}>()

const rate = (total: number, completed: number) =>
  total > 0 ? Math.round((completed / total) * 100) : 0
</script>

<template>
  <div class="gen-card stats-card">
    <h4>📊 任务统计</h4>
    <div class="stats-grid">
      <div>
        <span class="stats-num">{{ total }}</span>
        <span class="stats-label">总计</span>
      </div>
      <div>
        <span class="stats-num">{{ completed }}</span>
        <span class="stats-label">已完成</span>
      </div>
      <div>
        <span class="stats-num">{{ pending }}</span>
        <span class="stats-label">待办</span>
      </div>
      <div>
        <span class="stats-num">{{ highPriority }}</span>
        <span class="stats-label">高优先级</span>
      </div>
    </div>
    <div class="progress-bar">
      <div
        class="progress-fill"
        :style="{ width: `${rate(total, completed)}%` }"
      />
    </div>
    <p class="stats-rate">完成率 {{ rate(total, completed) }}%</p>
  </div>
</template>
