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
  stale?: (row: MergedScheduleRow) => boolean
) => useScheduleTable(ref(rows), ref(now), stale ? { stale } : {})

const times = (rows: MergedScheduleRow[]) => rows.map((r) => r.departure_time)

describe('useScheduleTable with its own idea of what is spent', () => {
  // The connection view decides on the bus, not the train. Standing in for that
  // here: everything before 10:00 is spent, whatever the row's own time says.
  //
  // Matched on the row's own fields: the rows arrive as reactive proxies, so an
  // identity check against the source array would never hold.
  const spentBefore10 = (row: MergedScheduleRow) => row.departure_time < '10:00:00'

  it('opens at the first row still worth offering', () => {
    const { rows, hiddenEarlierCount } = setup(day, '14:30:00', spentBefore10)

    expect(times(rows.value)[0]).toBe('10:00:00')
    expect(hiddenEarlierCount.value).toBe(5)
  })

  it('keeps a spent row on screen when the default rule would not', () => {
    // 10:00 to 14:00 have departed but are not spent, so they stay — which is
    // the point: a bus that has left may still be carrying you.
    const { rows } = setup(day, '14:30:00', spentBefore10)

    expect(times(rows.value).slice(0, 5)).toEqual([
      '10:00:00',
      '11:00:00',
      '12:00:00',
      '13:00:00',
      '14:00:00'
    ])
  })

  it('hides a row that has not departed yet once it is spent', () => {
    // The train is still to come, but its bus has gone: no use either way.
    const spent = (row: MergedScheduleRow) => row.departure_time < '12:00:00'
    const { rows } = setup(day, '09:00:00', spent)

    expect(times(rows.value)[0]).toBe('12:00:00')
  })

  it('shows nothing behind the button when every row is still good', () => {
    const { rows, hiddenEarlierCount } = setup(day, '14:30:00', () => false)

    expect(hiddenEarlierCount.value).toBe(0)
    expect(rows.value).toHaveLength(day.length)
  })

  it('still adds up to the whole day once expanded', () => {
    const { rows, hiddenEarlierCount, showEarlier } = setup(day, '14:30:00', spentBefore10)
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

    expect(times(rows.value).slice(0, RECENTLY_DEPARTED)).toEqual(['08:00:00', '09:00:00'])
    expect(times(rows.value)[RECENTLY_DEPARTED]).toBe('10:00:00')
    // Five had gone; two are shown, so the button offers the other three.
    expect(hiddenEarlierCount.value).toBe(3)
  })

  it('counts only what the button would actually reveal', () => {
    const { rows, hiddenEarlierCount, showEarlier } = setup(day, '09:30:00')
    const shown = rows.value.length

    showEarlier.value = true

    expect(rows.value).toHaveLength(shown + hiddenEarlierCount.value)
    expect(rows.value).toHaveLength(day.length)
  })

  it('offers no button when everything departed is already on screen', () => {
    // Only 05:00 and 06:00 have gone — both are shown.
    const { rows, hiddenEarlierCount } = setup(day, '06:30:00')

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

    expect(times(rows.value)).toEqual(['15:00:00', '16:00:00'])
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
    expect(isRecentlyDeparted(row('08:00:00'))).toBe(true)
    expect(isRecentlyDeparted(row('07:00:00'))).toBe(false)
    expect(isRecentlyDeparted(row('10:00:00'))).toBe(false)

    // Expanding the table must not start timers on the older rows.
    showEarlier.value = true
    expect(isRecentlyDeparted(row('07:00:00'))).toBe(false)
  })

  it('can be told to paint a row gone on something other than its own time', () => {
    // The connection view dims a row once its bus has left, even though the
    // train is still to come — it is past catching either way.
    const { rowClass } = useScheduleTable(ref(day), ref('09:00:00'), {
      passed: (r) => r.departure_time <= '11:00:00'
    })

    expect(rowClass(row('10:00:00'))).toBe('row-departed')
    expect(rowClass(row('11:00:00'))).toBe('row-departed')
    expect(rowClass(row('12:00:00'))).toBe('')
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
