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

/** Where a scheduled row came from: the live API, or the printed FGC poster. */
export type ScheduleRowSource = 'api' | 'timetable'

/**
 * A scheduled departure ready for the table. Rows recovered from the poster fill
 * in only what the view renders, so they stay interchangeable with API rows.
 */
export type MergedScheduleRow = Partial<Fields> & {
  departure_time: string
  route_short_name: string
  source: ScheduleRowSource
}
