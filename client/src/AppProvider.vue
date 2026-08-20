<script setup lang="ts">
import { CopilotKitProvider } from "@copilotkit/vue/v2"
import App from "./App.vue"
</script>

<template>
  <CopilotKitProvider
    runtime-url="/api/copilotkit"
    :use-single-endpoint="true"
    show-dev-console="auto"
  >
    <App />
  </CopilotKitProvider>
</template>
