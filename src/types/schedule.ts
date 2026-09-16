export interface Fields {
  arrival_time: string
  date: string
  departure_time: string
  exception_type: number
  route_color: string
  route_long_name: string
  route_short_name: string
  route_text_color: string
  route_type: number
  route_url: string
  shape_id: number
  stop_id: string
  stop_lat: number
  stop_lon: number
  stop_name: string
  stop_sequence: number
  timepoint: number
  trip_headsign: string
  wheelchair_boarding: number
}

import type { TimetableTrip } from '@/data/fgcTimetable'

/**
 * Where a scheduled row came from.
 *
 * 'timetable' means the live feed should have reported it and did not, which is
 * worth painting. 'posted' means there is no feed for that date at all — the
 * printed timetable is the only source, so nothing is missing from anything.
 */
export type ScheduleRowSource = 'api' | 'timetable' | 'posted'

/**
 * A scheduled departure ready for the table. Rows recovered from the poster fill
 * in only what the view renders, so they stay interchangeable with API rows.
 */
export type MergedScheduleRow = Partial<Fields> & {
  departure_time: string
  route_short_name: string
  source: ScheduleRowSource
  /**
   * The printed trip this row matched, where one was found. The API answers only
   * for the station it was asked about, so this is the sole way to know when the
   * same train reaches anywhere else.
   */
  trip?: TimetableTrip
}
