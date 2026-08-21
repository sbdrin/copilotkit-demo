<script setup lang="ts">
import { CopilotKitProvider } from "@copilotkit/vue/v2"
import App from "./App.vue"
import { API_TOKEN } from "./config"
</script>

<template>
  <CopilotKitProvider
    runtime-url="/api/copilotkit"
    :use-single-endpoint="true"
    show-dev-console="auto"
    :headers="{ Authorization: `Bearer ${API_TOKEN}` }"
  >
    <App />
  </CopilotKitProvider>
</template>
