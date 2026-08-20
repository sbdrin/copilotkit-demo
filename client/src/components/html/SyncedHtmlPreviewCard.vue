<script setup lang="ts">
import { computed, ref, watch } from "vue"
import HtmlPreviewCard from "./HtmlPreviewCard.vue"

const RECENT_HTML_MS = 60_000
const recentHtmlSlots = new Map<string, { at: number; ownerId: string }>()

function getHtmlPreviewKey(title: string, html: string) {
  return `${title}::${html.trim()}`
}

function claimHtmlPreviewSlot(key: string, ownerId: string) {
  const now = Date.now()
  const slot = recentHtmlSlots.get(key)
  if (
    slot != null &&
    slot.ownerId !== ownerId &&
    now - slot.at < RECENT_HTML_MS
  ) {
    return false
  }
  recentHtmlSlots.set(key, { at: now, ownerId })
  return true
}

const props = withDefaults(
  defineProps<{
    title?: string
    html?: string | null
    height?: number
    complete?: boolean
    onSync: (title: string, html: string) => void
  }>(),
  {
    title: "HTML 预览",
    html: "",
    complete: true,
  },
)

const ownerId = `html-${Math.random().toString(36).slice(2)}`
const synced = ref(false)

const resolvedTitle = computed(() => props.title ?? "HTML 预览")
const trimmedHtml = computed(() => (props.html ?? "").trim())

const shouldRender = computed(() => {
  if (!props.complete || !trimmedHtml.value) return true
  return claimHtmlPreviewSlot(
    getHtmlPreviewKey(resolvedTitle.value, trimmedHtml.value),
    ownerId,
  )
})

watch(
  [resolvedTitle, trimmedHtml, shouldRender, () => props.complete],
  () => {
    if (!props.complete || !trimmedHtml.value || !shouldRender.value) return
    if (synced.value) return
    synced.value = true
    props.onSync(resolvedTitle.value, trimmedHtml.value)
  },
  { immediate: true },
)
</script>

<template>
  <HtmlPreviewCard
    v-if="shouldRender"
    :title="resolvedTitle"
    :html="trimmedHtml"
    :height="height"
    :complete="complete"
  />
</template>
