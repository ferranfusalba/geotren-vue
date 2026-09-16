import type { TimetableTrip } from '@/data/fgcTimetable'
import type { Fields, MergedScheduleRow } from '@/types/schedule'
import { departureAt, MATCH_TOLERANCE, toMinutes, toTimeString } from '@/utils/timetable'

/**
 * Merges what the API reported with what the poster prints, so a train the API
 * dropped still shows up — flagged, rather than silently absent.
 *
 * `trips` must already be narrowed to this view's population with `tripsFor`;
 * this function knows nothing about headsigns or destinations and must not
 * re-filter, or it would start reporting trains the API was never asked for.
 */
export const crossCheckSchedule = (
  apiRows: Fields[],
  trips: TimetableTrip[],
  station: string
): MergedScheduleRow[] => {
  const candidates = trips
    .map((trip) => ({ trip, minute: departureAt(trip, station) }))
    .filter((candidate): candidate is { trip: TimetableTrip; minute: number } =>
      candidate.minute !== null
    )
    .sort((a, b) => a.minute - b.minute)

  const claimed = new Set<number>()

  const fromApi: MergedScheduleRow[] = apiRows.map((row) => {
    const minute = toMinutes(row.departure_time)

    // Closest unclaimed printed train within the tolerance; where two are equally
    // close, prefer the one whose line agrees with what the API reported.
    let best = -1
    let bestDistance = Infinity
    candidates.forEach((candidate, index) => {
      if (claimed.has(index)) return
      const distance = Math.abs(candidate.minute - minute)
      if (distance > MATCH_TOLERANCE) return

      const better =
        distance < bestDistance ||
        (distance === bestDistance && candidate.trip.line === row.route_short_name)
      if (better) {
        best = index
        bestDistance = distance
      }
    })

    if (best !== -1) claimed.add(best)
    return { ...row, source: 'api' as const }
  })

  const fromTimetable: MergedScheduleRow[] = candidates
    .filter((_, index) => !claimed.has(index))
    .map(({ trip, minute }) => ({
      departure_time: toTimeString(minute),
      arrival_time: toTimeString(minute),
      route_short_name: trip.line ?? '',
      source: 'timetable' as const
    }))

  return [...fromApi, ...fromTimetable].sort((a, b) =>
    a.departure_time.localeCompare(b.departure_time)
  )
}
