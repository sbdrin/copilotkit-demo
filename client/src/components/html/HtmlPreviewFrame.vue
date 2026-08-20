<script setup lang="ts">
import { computed } from "vue"
import { wrapHtmlDocument } from "./html-utils"

const props = withDefaults(
  defineProps<{
    html?: string | null
    title?: string
    height?: number
    allowScripts?: boolean
  }>(),
  {
    title: "Preview",
    height: 280,
    allowScripts: true,
  },
)

const doc = computed(() => wrapHtmlDocument(props.html, props.title))
const sandbox = computed(() =>
  props.allowScripts
    ? "allow-scripts allow-popups allow-forms"
    : "allow-popups allow-forms",
)
</script>

<template>
  <iframe
    class="html-preview-iframe"
    :title="title"
    :srcdoc="doc"
    :sandbox="sandbox"
    :style="{ height: `${height}px` }"
  />
</template>
