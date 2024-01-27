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

export interface ScheduleRecordsItem {
  datasetid: string
  fields: Fields
  record_timestamp: string
  recordid: string
}
