import { computed, ref, type Ref } from 'vue'

import type { MergedScheduleRow } from '@/types/schedule'

/**
 * How many already-departed trains stay on screen without being asked for.
 *
 * The scheduled and real-time feeds share no train id, so a train running a
 * couple of minutes late is simply past its scheduled time — it would drop off
 * the table while still sitting in the arrivals list above. Keeping the last few
 * on screen covers that, and the near miss you might still be able to catch.
 */
export const RECENTLY_DEPARTED = 3

/**
 * Splits a day of departures into what is still catchable and what has gone.
 *
 * `now` is the snapshot the store took when the view mounted, not a live clock,
 * so rows do not reshuffle underneath you while you are reading them.
 */
export const useScheduleTable = (allRows: Ref<MergedScheduleRow[]>, now: Ref<string>) => {
  const showEarlier = ref(false)

  const hasDeparted = (row: MergedScheduleRow) => row.departure_time < now.value

  const departed = computed(() => allRows.value.filter(hasDeparted))
  const upcoming = computed(() => allRows.value.filter((row) => !hasDeparted(row)))

  /** The handful kept on screen whether or not the button has been pressed. */
  const recentlyDeparted = computed(() => departed.value.slice(-RECENTLY_DEPARTED))

  /** Only the ones the button would reveal — the recent few are already shown. */
  const hiddenEarlierCount = computed(() => Math.max(departed.value.length - RECENTLY_DEPARTED, 0))

  const rows = computed(() =>
    showEarlier.value ? allRows.value : [...recentlyDeparted.value, ...upcoming.value]
  )

  /**
   * Matched on the departure time rather than by identity: the table hands its
   * slots its own view of a row, which is not guaranteed to be the same object.
   */
  const recentTimes = computed(
    () => new Set(recentlyDeparted.value.map((row) => row.departure_time))
  )
  const isRecentlyDeparted = (row: MergedScheduleRow) =>
    hasDeparted(row) && recentTimes.value.has(row.departure_time)

  /**
   * 'row-missing': the API never reported it and it came off the printed
   * timetable, painted so a gap in the open data is visible rather than silent.
   * 'row-departed': already gone, dimmed so it cannot be mistaken for a train to
   * catch.
   */
  const rowClass = (row: MergedScheduleRow) =>
    [row.source === 'timetable' ? 'row-missing' : '', hasDeparted(row) ? 'row-departed' : '']
      .filter(Boolean)
      .join(' ')

  return { rows, showEarlier, hiddenEarlierCount, hasDeparted, isRecentlyDeparted, rowClass }
}
