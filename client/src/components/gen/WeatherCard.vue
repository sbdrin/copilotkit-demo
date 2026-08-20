<script setup lang="ts">
defineProps<{
  city: string
  temperature: number
  unit?: string
  condition: string
  humidity?: string
}>()
</script>

<template>
  <div class="gen-card weather-card">
    <div class="gen-card-icon">🌤</div>
    <div>
      <h4>{{ city }}</h4>
      <p class="weather-temp">{{ temperature }}{{ unit ?? "°C" }}</p>
      <p class="weather-meta">
        {{ condition }}<template v-if="humidity"> · 湿度 {{ humidity }}</template>
      </p>
    </div>
  </div>
</template>
