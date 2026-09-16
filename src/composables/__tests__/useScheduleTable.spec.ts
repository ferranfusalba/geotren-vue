import { describe, it, expect } from 'vitest'
import { ref } from 'vue'

import { RECENTLY_DEPARTED, useScheduleTable } from '@/composables/useScheduleTable'
import type { MergedScheduleRow } from '@/types/schedule'

const row = (departure_time: string, source: 'api' | 'timetable' = 'api'): MergedScheduleRow => ({
  departure_time,
  route_short_name: 'S8',
  source
})

/** A day of departures every hour from 05:00, so "now" can sit anywhere in it. */
const day = Array.from({ length: 12 }, (_, i) => row(`${String(5 + i).padStart(2, '0')}:00:00`))

const setup = (
  rows: MergedScheduleRow[],
  now: string,
  anchor?: (row: MergedScheduleRow) => boolean
) => useScheduleTable(ref(rows), ref(now), anchor ? { anchor } : {})

const times = (rows: MergedScheduleRow[]) => rows.map((r) => r.departure_time)

describe('useScheduleTable look-back anchored on another row', () => {
  // The connection view counts in buses, not trains. Every third row here
  // carries one — 05:00, 08:00, 11:00, 14:00 — so three buses reach back nine
  // rows rather than three.
  //
  // Matched on the row's own fields: the rows arrive as reactive proxies, so an
  // identity check against the source array would never hold.
  const hasBus = (row: MergedScheduleRow) => Number(row.departure_time.slice(0, 2)) % 3 === 2

  it('reaches back far enough to cover the last few anchors', () => {
    const { rows, hiddenEarlierCount } = setup(day, '14:30:00', hasBus)

    // 05:00-14:00 have gone. The anchors among them are 05:00, 08:00, 11:00 and
    // 14:00, so the window opens at 08:00 and keeps everything after it.
    expect(times(rows.value)[0]).toBe('08:00:00')
    expect(hiddenEarlierCount.value).toBe(3)
  })

  it('keeps the rows between the anchors, not just the anchors', () => {
    const { rows } = setup(day, '14:30:00', hasBus)

    expect(times(rows.value).slice(0, 4)).toEqual(['08:00:00', '09:00:00', '10:00:00', '11:00:00'])
  })

  it('falls back to counting rows before the first anchor has gone', () => {
    // Nothing departed carries a bus yet, so it behaves like the other views.
    const { rows } = setup(day, '07:30:00', () => false)

    expect(times(rows.value).slice(0, RECENTLY_DEPARTED)).toEqual([
      '05:00:00',
      '06:00:00',
      '07:00:00'
    ])
  })

  it('still adds up to the whole day once expanded', () => {
    const { rows, hiddenEarlierCount, showEarlier } = setup(day, '14:30:00', hasBus)
    const shown = rows.value.length

    showEarlier.value = true

    expect(rows.value).toHaveLength(shown + hiddenEarlierCount.value)
    expect(rows.value).toHaveLength(day.length)
  })
})

describe('useScheduleTable', () => {
  it('keeps the last few departures on screen without being asked', () => {
    // 05:00-09:00 have gone, 10:00 onwards have not.
    const { rows, hiddenEarlierCount } = setup(day, '09:30:00')

    expect(times(rows.value).slice(0, RECENTLY_DEPARTED)).toEqual([
      '07:00:00',
      '08:00:00',
      '09:00:00'
    ])
    expect(times(rows.value)[RECENTLY_DEPARTED]).toBe('10:00:00')
    // Five had gone; three are shown, so the button offers the other two.
    expect(hiddenEarlierCount.value).toBe(2)
  })

  it('counts only what the button would actually reveal', () => {
    const { rows, hiddenEarlierCount, showEarlier } = setup(day, '09:30:00')
    const shown = rows.value.length

    showEarlier.value = true

    expect(rows.value).toHaveLength(shown + hiddenEarlierCount.value)
    expect(rows.value).toHaveLength(day.length)
  })

  it('offers no button when everything departed is already on screen', () => {
    // Only 05:00, 06:00 and 07:00 have gone — all three are shown.
    const { rows, hiddenEarlierCount } = setup(day, '07:30:00')

    expect(hiddenEarlierCount.value).toBe(0)
    expect(times(rows.value)[0]).toBe('05:00:00')
  })

  it('handles a day that has not started yet', () => {
    const { rows, hiddenEarlierCount } = setup(day, '04:00:00')

    expect(hiddenEarlierCount.value).toBe(0)
    expect(rows.value).toHaveLength(day.length)
  })

  it('handles a day that is over', () => {
    const { rows, hiddenEarlierCount } = setup(day, '23:59:00')

    expect(times(rows.value)).toEqual(['14:00:00', '15:00:00', '16:00:00'])
    expect(hiddenEarlierCount.value).toBe(day.length - RECENTLY_DEPARTED)
  })

  it('keeps a train that is running late rather than dropping it', () => {
    // The 08:14 S8 two minutes down is past its scheduled time but still coming,
    // and the real-time feed shares no id we could match it by.
    const rows = [row('08:14:00'), row('08:20:00'), row('08:30:00')]
    const { rows: visible } = setup(rows, '08:16:00')

    expect(times(visible.value)).toContain('08:14:00')
  })

  it('flags only the recent departures as worth a ticking cell', () => {
    // Those few get an elapsed timer; the rest, revealed by the button, do not —
    // otherwise a full day would leave dozens of intervals running.
    const { isRecentlyDeparted, showEarlier } = setup(day, '09:30:00')

    expect(isRecentlyDeparted(row('09:00:00'))).toBe(true)
    expect(isRecentlyDeparted(row('07:00:00'))).toBe(true)
    expect(isRecentlyDeparted(row('06:00:00'))).toBe(false)
    expect(isRecentlyDeparted(row('10:00:00'))).toBe(false)

    // Expanding the table must not start timers on the older rows.
    showEarlier.value = true
    expect(isRecentlyDeparted(row('06:00:00'))).toBe(false)
  })

  it('marks departed and recovered rows so the table can paint them', () => {
    const { rowClass } = setup([], '09:00:00')

    expect(rowClass(row('08:00:00'))).toBe('row-departed')
    expect(rowClass(row('10:00:00'))).toBe('')
    expect(rowClass(row('10:00:00', 'timetable'))).toBe('row-missing')
    expect(rowClass(row('08:00:00', 'timetable'))).toBe('row-missing row-departed')
  })

  it('treats a departure past midnight as still to come', () => {
    // The API reports these as 24:xx, which must not read as early morning.
    const { hasDeparted } = setup([], '23:50:00')

    expect(hasDeparted(row('24:05:00'))).toBe(false)
    expect(hasDeparted(row('23:40:00'))).toBe(true)
  })
})
