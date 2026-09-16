<template>
  <div class="day-selector" role="group" aria-label="Which day to show">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :class="{ active: modelValue === option.value }"
      :aria-pressed="modelValue === option.value"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ScheduleDay } from '@/stores/schedule'

defineProps<{ modelValue: ScheduleDay }>()
const emit = defineEmits<{ 'update:modelValue': [ScheduleDay] }>()

const options: { value: ScheduleDay; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' }
]
</script>

<style scoped lang="scss">
// The nav's own shape: a green bar with the chosen item sitting in it as a grey
// pill, so the two controls read as the same kind of thing.
.day-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  justify-items: center;
  align-items: center;
  height: 2.25rem;
  background-color: var(--color-corporative-primary);
  // Stays put while the day scrolls past, so the other day is always one tap away.
  position: sticky;
  top: 0;
  // Above the table's own sticky header, which rides at 1 below a selector.
  z-index: 3;
  // Closes the layout's own 8px gap, so the bar sits straight on the table head.
  margin-bottom: -8px;

  button {
    font-family: inherit;
    font-size: 1rem;
    font-weight: 500;
    width: 80%;
    padding: 4px 0;
    border: none;
    border-radius: 1.5625rem;
    background-color: transparent;
    color: var(--color-corporative-secondary);
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;

    &.active {
      background-color: var(--color-corporative-secondary);
      box-shadow: -4px -4px 4px 0px rgba(0, 0, 0, 0.25) inset;
      color: var(--color-white);
    }
  }
}
</style>
