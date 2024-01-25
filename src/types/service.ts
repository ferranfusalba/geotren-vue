export interface Stop {
  parada: string
}

export interface Service {
  ocupacio_m2_tram: string
  lin: string
  id: string
  ocupacio_m1_tram: string
  ocupacio_m2_percent: string
  geo_point_2d: number[]
  ocupacio_m1_percent: string
  ocupacio_mi_percent: string
  ocupacio_mi_tram: string
  origen: string
  dir: string
  desti: string
  en_hora: string
  ut: string
  tipus_unitat: string
  properes_parades: string
  properes_parades_arr: Stop[]
}
