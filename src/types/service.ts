export interface Stop {
  parada: string
}

export interface Service {
  desti: string
  dir: string
  en_hora: string
  geo_point_2d: number[]
  id: string
  lin: string
  ocupacio_m1_percent: string
  ocupacio_m1_tram: string
  ocupacio_m2_percent: string
  ocupacio_m2_tram: string
  ocupacio_mi_percent: string
  ocupacio_mi_tram: string
  origen: string
  properes_parades: string
  tipus_unitat: string
  ut: string
  //
  next_stops: Stop[]
  distance: number
}

export interface RecordsItem {
  datasetid: string
  fields: Service
  geometry: { type: string; coordinates: number[] }
  record_timestamp: string
  recordid: string
}
