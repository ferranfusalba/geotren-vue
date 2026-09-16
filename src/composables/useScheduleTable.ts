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
   * Rows that are no longer worth offering. The table opens at the first row
   * this says no to, and everything before it goes behind the button.
   *
   * Defaults to "already departed", less the last few. The connection view needs
   * its own answer: there a row is spent once its bus has gone, whatever its
   * train is doing, since a train you cannot reach is no use.
   *
   * Decide from the row's own fields. Rows reach here as reactive proxies, so
   * comparing identity against whatever produced them will not hold.
   */
  stale?: (row: T) => boolean

  /**
   * Whether a row reads as gone, for the dimming. Separate from `stale`, which
   * decides what is hidden: a bus that left ten minutes ago is past catching but
   * still on screen, so it should look it.
   *
   * Defaults to "already departed". Note this does not touch the countdown in
   * the last column, which follows the train whatever the bus is doing.
   */
  passed?: (row: T) => boolean
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

  /**
   * Where the default view opens. The rows are in departure order and the spent
   * ones are a prefix, so this is just the first row still worth offering.
   */
  const firstShown = computed(() => {
    if (options.stale) {
      const index = allRows.value.findIndex((row) => !options.stale!(row))
      return index === -1 ? allRows.value.length : index
    }
    return Math.max(departed.value.length - RECENTLY_DEPARTED, 0)
  })

  /** The rows kept on screen whether or not the button has been pressed. */
  const recentlyDeparted = computed(() => allRows.value.slice(firstShown.value).filter(hasDeparted))

  /** Only the ones the button would reveal — the rest are already shown. */
  const hiddenEarlierCount = computed(() => firstShown.value)

  const rows = computed(() =>
    showEarlier.value ? allRows.value : allRows.value.slice(firstShown.value)
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
  const isPassed = (row: T) => (options.passed ? options.passed(row) : hasDeparted(row))

  const rowClass = (row: T) =>
    [row.source === 'timetable' ? 'row-missing' : '', isPassed(row) ? 'row-departed' : '']
      .filter(Boolean)
      .join(' ')

  return { rows, showEarlier, hiddenEarlierCount, hasDeparted, isRecentlyDeparted, rowClass }
}
