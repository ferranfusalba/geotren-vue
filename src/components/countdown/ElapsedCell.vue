<template>
  <span>{{ elapsed }}</span>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'

/**
 * How long ago a train was due, counting up — the countdown's mirror image.
 *
 * Useful for the two things that happen once a departure is behind you: seeing
 * by how much you missed it, and reading off a delay, since a train a couple of
 * minutes down is simply past its scheduled time and the two feeds share no id
 * that would let us match it to the arrivals list.
 *
 * No minus sign: the row is already dimmed and italic, which says "past" without
 * spending a character on it.
 */
const props = defineProps<{ departure_time: string }>()

const now = ref(Date.now())
const ticker = window.setInterval(() => (now.value = Date.now()), 1000)
onUnmounted(() => window.clearInterval(ticker))

// Same shape as CountdownCell reads: 'HH:MM:SS' on today's date.
const dueAt = computed(() => {
  const today = new Date()
  const [hours, minutes, seconds] = props.departure_time.split(':').map(Number)
  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    hours,
    minutes,
    seconds
  ).valueOf()
})

const elapsed = computed(() => {
  const total = Math.floor(Math.max(now.value - dueAt.value, 0) / 1000)
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`
})
</script>
