import { E8_STOPS, type E8Trip } from '@/data/e8Timetable'
import type { MergedScheduleRow } from '@/types/schedule'
import { toMinutes } from '@/utils/timetable'

/** The change at Quatre Camins, at a run. Walking it takes three or four. */
export const TRANSFER_MINUTES = 2

/** Below this the connection only works if you run for it. */
export const COMFORTABLE_MINUTES = 3

export interface E8Connection {
  /** Departure from Francesc Macià, in minutes past midnight. */
  departure: number
  /** Arrival at Quatre Camins. */
  arrival: number
  viaMolins: boolean
  /** Minutes between stepping off the bus and the train leaving. */
  slack: number
  schoolDaysOnly: boolean
}

export interface ConnectionRow extends MergedScheduleRow {
  e8?: E8Connection
  /**
   * For a train with no bus of its own: the bus you would already be riding, and
   * the wait at Quatre Camins once it drops you. A missed tight connection still
   * shows what taking the next train would cost you.
   *
   * The bus is carried, not just the wait, because the row shares that bus's
   * fate: once it is too late to board, this train is out of reach as well.
   */
  earlierBus?: { departure: number; wait: number }
}

const stopIndex = (stop: (typeof E8_STOPS)[number]) => E8_STOPS.indexOf(stop)

/**
 * Pairs each bus with the train you could actually catch off it.
 *
 * The table stays one row per train, because the train is what you are trying to
 * reach; the bus columns are filled in only against the train its passengers
 * would board. A train whose best bus is one already shown against an earlier
 * train gets no bus cells, which is what makes the gaps in the table meaningful:
 *
 *     e8 9.00 -> 9.20 | FGC 9:25
 *                     | FGC 9:35     <- nothing; you would have taken the 9:25
 *     e8 10.00 -> ...
 *
 * Where two buses resolve to the same train the later one wins: both sets of
 * passengers catch it, but only the later bus is worth leaving the house for.
 */
export const pairE8WithTrains = (trips: E8Trip[], trains: MergedScheduleRow[]): ConnectionRow[] => {
  const fm = stopIndex('FM')
  const qc = stopIndex('QC')
  const molins = stopIndex('MOLINS')

  const ordered = [...trains].sort(
    (a, b) => toMinutes(a.departure_time) - toMinutes(b.departure_time)
  )
  const claimed = new Map<number, E8Connection>()

  for (const trip of trips) {
    const departure = trip.stops[fm]
    const arrival = trip.stops[qc]
    // An expedition that starts partway down the line cannot be boarded at
    // Francesc Macià, so it is no use for this journey.
    if (departure === null || arrival === null) continue

    const index = ordered.findIndex(
      (train) => toMinutes(train.departure_time) - arrival >= TRANSFER_MINUTES
    )
    if (index === -1) continue

    const previous = claimed.get(index)
    if (previous && previous.arrival > arrival) continue

    claimed.set(index, {
      departure,
      arrival,
      viaMolins: trip.stops[molins] !== null,
      slack: toMinutes(ordered[index].departure_time) - arrival,
      schoolDaysOnly: Boolean(trip.schoolDaysOnly)
    })
  }

  let previous: E8Connection | null = null
  return ordered.map((train, index) => {
    const e8 = claimed.get(index)
    if (e8) {
      previous = e8
      return { ...train, e8 }
    }
    if (previous === null) return { ...train }
    return {
      ...train,
      earlierBus: {
        departure: previous.departure,
        wait: toMinutes(train.departure_time) - previous.arrival
      }
    }
  })
}
