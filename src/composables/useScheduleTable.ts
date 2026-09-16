import { computed, ref, type Ref } from 'vue'

import type { MergedScheduleRow } from '@/types/schedule'

/**
 * How far back the table reaches without being asked, counted in anchor rows.
 *
 * The scheduled and real-time feeds share no train id, so a train running a
 * couple of minutes late is simply past its scheduled time — it would drop off
 * the table while still sitting in the arrivals list above. Keeping the last few
 * on screen covers that, and the near miss you might still be able to catch.
 */
export const RECENTLY_DEPARTED = 3

export interface ScheduleTableOptions<T extends MergedScheduleRow> {
  /**
   * Which rows the look-back is counted in. Everything from the third-from-last
   * of these onwards stays on screen, intervening rows included.
   *
   * The connection view counts in buses rather than trains: if you are sitting
   * on a bus that has already left, you still need the trains waiting for you at
   * the other end, and there are more trains than buses.
   *
   * Decide from the row's own fields. Rows reach here as reactive proxies, so
   * comparing identity against whatever produced them will not hold.
   */
  anchor?: (row: T) => boolean
}

/**
 * Splits a day of departures into what is still catchable and what has gone.
 *
 * `now` is the snapshot the store took when the view mounted, not a live clock,
 * so rows do not reshuffle underneath you while you are reading them.
 */
export const useScheduleTable = <T extends MergedScheduleRow>(
  allRows: Ref<T[]>,
  now: Ref<string>,
  options: ScheduleTableOptions<T> = {}
) => {
  const showEarlier = ref(false)

  const hasDeparted = (row: MergedScheduleRow) => row.departure_time < now.value

  const departed = computed(() => allRows.value.filter(hasDeparted))
  const upcoming = computed(() => allRows.value.filter((row) => !hasDeparted(row)))

  /**
   * Where the default view starts: far enough back to include the last few
   * anchor rows. Falls back to counting plain rows when none of what has gone
   * carries an anchor, so the table behaves the same before the first bus.
   */
  const firstShown = computed(() => {
    const anchors = options.anchor ? departed.value.filter(options.anchor) : departed.value
    const recent = (anchors.length ? anchors : departed.value).slice(-RECENTLY_DEPARTED)
    if (recent.length === 0) return departed.value.length
    return departed.value.indexOf(recent[0])
  })

  /** The rows kept on screen whether or not the button has been pressed. */
  const recentlyDeparted = computed(() => departed.value.slice(firstShown.value))

  /** Only the ones the button would reveal — the recent few are already shown. */
  const hiddenEarlierCount = computed(() => firstShown.value)

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
