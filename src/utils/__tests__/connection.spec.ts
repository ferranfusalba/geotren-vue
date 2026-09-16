import { describe, it, expect } from 'vitest'

import { E8_STOPS, type E8Trip } from '@/data/e8Timetable'
import { TIMETABLE_STATIONS, type TimetableTrip } from '@/data/fgcTimetable'
import type { MergedScheduleRow } from '@/types/schedule'
import { pairE8WithTrains, pairTrainsWithE8, TRANSFER_MINUTES } from '@/utils/connection'
import { toTimeString } from '@/utils/timetable'

const FM = E8_STOPS.indexOf('FM')
const QC = E8_STOPS.indexOf('QC')
const MOLINS = E8_STOPS.indexOf('MOLINS')

const at = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5))

/** A bus leaving Francesc Macià and reaching Quatre Camins, optionally via Molins. */
const bus = (departure: string, arrival: string, opts: Partial<E8Trip> = {}): E8Trip => {
  const stops: (number | null)[] = new Array(E8_STOPS.length).fill(null)
  stops[FM] = at(departure)
  stops[QC] = at(arrival)
  if (opts.stops?.[MOLINS] != null) stops[MOLINS] = opts.stops[MOLINS]
  return { ...opts, stops }
}

const train = (clock: string): MergedScheduleRow => ({
  departure_time: toTimeString(at(clock)),
  route_short_name: 'S4',
  source: 'api'
})

const shape = (rows: ReturnType<typeof pairE8WithTrains>) =>
  rows.map(
    (r) =>
      `${r.departure_time.slice(0, 5)} ${
        r.e8 ? `<- ${toTimeString(r.e8.arrival).slice(0, 5)}` : '--'
      }`
  )

describe('pairE8WithTrains', () => {
  it('fills the bus in only against the train you would catch off it', () => {
    // The worked example: a train whose best bus is one already shown earlier
    // gets nothing, so the blank row means "you would have taken the 9:25".
    const rows = pairE8WithTrains(
      [bus('09:00', '09:20'), bus('10:00', '10:20')],
      [train('09:25'), train('09:35'), train('10:25')]
    )

    expect(shape(rows)).toEqual(['09:25 <- 09:20', '09:35 --', '10:25 <- 10:20'])
  })

  it('shows what a later train would cost you from the same bus', () => {
    // No bus of its own, so the 09:35 reports the wait you would have at Quatre
    // Camins had you taken the 09:00 that is already shown against the 09:25.
    const rows = pairE8WithTrains([bus('09:00', '09:20')], [train('09:25'), train('09:35')])

    expect(rows[0].earlierBus).toBeUndefined()
    expect(rows[1].e8).toBeUndefined()
    expect(rows[1].earlierBus?.wait).toBe(15)
    // The bus itself is carried, not just the wait: the row is out of reach the
    // moment that bus is, however far off its train still is.
    expect(rows[1].earlierBus?.departure).toBe(at('09:00'))
  })

  it('leaves trains before the first bus with nothing to wait for', () => {
    const rows = pairE8WithTrains([bus('09:00', '09:20')], [train('06:00'), train('09:25')])

    expect(rows[0].earlierBus).toBeUndefined()
  })

  it('measures the wait from the most recent bus, not the first', () => {
    const rows = pairE8WithTrains(
      [bus('09:00', '09:20'), bus('09:30', '09:50')],
      [train('09:25'), train('09:55'), train('10:10')]
    )

    expect(rows[1].e8?.arrival).toBe(at('09:50'))
    expect(rows[2].earlierBus?.wait).toBe(20)
    expect(rows[2].earlierBus?.departure).toBe(at('09:30'))
  })

  it('leaves every train alone when no bus runs', () => {
    const rows = pairE8WithTrains([], [train('09:25'), train('09:35')])

    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.e8 === undefined)).toBe(true)
  })

  it('will not offer a change it is impossible to make', () => {
    // One minute is not enough even at a run, so this train stands alone.
    const rows = pairE8WithTrains([bus('09:00', '09:24')], [train('09:25')])

    expect(rows[0].e8).toBeUndefined()
    expect(TRANSFER_MINUTES).toBe(2)
  })

  it('takes exactly the transfer margin', () => {
    const rows = pairE8WithTrains([bus('09:00', '09:23')], [train('09:25')])

    expect(rows[0].e8?.slack).toBe(2)
  })

  it('keeps the later bus when two land on the same train', () => {
    // Both sets of passengers make the 09:25, but only the 09:05 is worth
    // leaving the house for.
    const rows = pairE8WithTrains([bus('08:45', '09:05'), bus('09:05', '09:22')], [train('09:25')])

    expect(rows[0].e8?.arrival).toBe(at('09:22'))
    expect(rows[0].e8?.departure).toBe(at('09:05'))
  })

  it('ignores a bus that cannot be boarded at Francesc Macià', () => {
    // A few expeditions start partway down the line; they are no use here.
    const fromMolins = bus('09:00', '09:20')
    fromMolins.stops[FM] = null

    expect(pairE8WithTrains([fromMolins], [train('09:25')])[0].e8).toBeUndefined()
  })

  it('reports whether the bus went via Molins', () => {
    const viaMolins = bus('09:00', '09:20', { stops: [] })
    viaMolins.stops[MOLINS] = at('09:16')

    const rows = pairE8WithTrains(
      [viaMolins, bus('10:00', '10:20')],
      [train('09:25'), train('10:25')]
    )

    expect(rows[0].e8?.viaMolins).toBe(true)
    expect(rows[1].e8?.viaMolins).toBe(false)
  })

  it('carries the school-term flag through to the view', () => {
    const rows = pairE8WithTrains(
      [bus('09:00', '09:20', { schoolDaysOnly: true })],
      [train('09:25')]
    )

    expect(rows[0].e8?.schoolDaysOnly).toBe(true)
  })

  it('sorts trains chronologically across midnight', () => {
    // The API reports a departure after midnight as 24:xx, which must sort last.
    const rows = pairE8WithTrains([], [train('24:05'), train('23:40')])

    expect(rows.map((r) => r.departure_time)).toEqual(['23:40:00', '24:05:00'])
  })

  it('pairs a bus with a train on the far side of midnight', () => {
    const rows = pairE8WithTrains([bus('23:40', '24:00')], [train('24:05')])

    expect(rows[0].e8?.slack).toBe(5)
  })
})

/** A train leaving Martorell Central and reaching Quatre Camins. */
const trainVia = (departure: string, qc: string): MergedScheduleRow => {
  const stops: (number | null)[] = new Array(TIMETABLE_STATIONS.length).fill(null)
  stops[TIMETABLE_STATIONS.indexOf('MC')] = at(departure)
  stops[TIMETABLE_STATIONS.indexOf('QC')] = at(qc)
  return { ...train(departure), trip: { stops, line: 'S8' } as TimetableTrip }
}

/** A bus leaving Quatre Camins for Francesc Macia. */
const onward = (departure: string, arrival: string, opts: Partial<E8Trip> = {}): E8Trip => {
  const stops: (number | null)[] = new Array(E8_STOPS.length).fill(null)
  stops[QC] = at(departure)
  stops[FM] = at(arrival)
  return { ...opts, stops }
}

describe('pairTrainsWithE8', () => {
  it('gives each train the bus it hands you to', () => {
    const rows = pairTrainsWithE8(
      [trainVia('09:00', '09:20'), trainVia('09:30', '09:50')],
      [onward('09:25', '09:50'), onward('09:55', '10:20')]
    )

    expect(rows.map((r) => r.bus?.departure)).toEqual([at('09:25'), at('09:55')])
    expect(rows.map((r) => r.bus?.slack)).toEqual([5, 5])
    expect(rows.map((r) => r.wait)).toEqual([5, 5])
  })

  it('gives a shared bus to the last train that can catch it', () => {
    // More trains than buses, so several reach the same one. Only the last of
    // them is worth aiming for; the earlier ones would only wait longer.
    const rows = pairTrainsWithE8(
      [trainVia('09:00', '09:20'), trainVia('09:10', '09:30')],
      [onward('09:40', '10:05')]
    )

    expect(rows.map((r) => r.bus?.departure)).toEqual([undefined, at('09:40')])
    expect(rows.map((r) => r.wait)).toEqual([20, 10])
  })

  it('keeps the wait on a train whose bus is printed further down', () => {
    // The 9:33 reaches the same bus as the 9:43, so the bus rides with the 9:43
    // and the 9:33 keeps only what taking it would cost: fourteen minutes at QC.
    const rows = pairTrainsWithE8(
      [trainVia('09:33', '09:47'), trainVia('09:43', '09:56')],
      [onward('10:01', '10:30')]
    )

    expect(rows[0].bus).toBeUndefined()
    expect(rows[0].wait).toBe(14)
    expect(rows[1].bus?.departure).toBe(at('10:01'))
    expect(rows[1].wait).toBe(5)
  })

  it('gives each bus to its own last train when there are several', () => {
    const rows = pairTrainsWithE8(
      [trainVia('09:00', '09:20'), trainVia('09:10', '09:30'), trainVia('09:40', '10:00')],
      [onward('09:40', '10:05'), onward('10:10', '10:35')]
    )

    expect(rows.map((r) => r.bus?.departure)).toEqual([undefined, at('09:40'), at('10:10')])
  })

  it('will not offer a change it is impossible to make', () => {
    const rows = pairTrainsWithE8([trainVia('09:00', '09:20')], [onward('09:21', '09:46')])

    expect(rows[0].bus).toBeUndefined()
    expect(rows[0].wait).toBeUndefined()
    expect(rows[0].qc).toBe(at('09:20'))
  })

  it('takes exactly the transfer margin', () => {
    const rows = pairTrainsWithE8([trainVia('09:00', '09:20')], [onward('09:22', '09:47')])

    expect(rows[0].bus?.slack).toBe(TRANSFER_MINUTES)
  })

  it('leaves the last trains of the night without a bus', () => {
    const rows = pairTrainsWithE8([trainVia('23:40', '24:00')], [onward('09:25', '09:50')])

    expect(rows[0].bus).toBeUndefined()
  })

  it('drops a train it cannot place at Quatre Camins', () => {
    // Without a printed trip there is no way to know when it gets there, so
    // there is nothing to connect it to.
    const rows = pairTrainsWithE8([train('09:00')], [onward('09:25', '09:50')])

    expect(rows).toHaveLength(0)
  })

  it('reports the Molins detour and the school-term flag', () => {
    const viaMolins = onward('09:25', '09:55', { schoolDaysOnly: true })
    viaMolins.stops[E8_STOPS.indexOf('MOLINS')] = at('09:35')

    const rows = pairTrainsWithE8([trainVia('09:00', '09:20')], [viaMolins])

    expect(rows[0].bus?.viaMolins).toBe(true)
    expect(rows[0].bus?.schoolDaysOnly).toBe(true)
  })
})
