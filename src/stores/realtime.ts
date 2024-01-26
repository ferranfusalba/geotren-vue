import { defineStore } from 'pinia'
import axios from 'axios'
import type { Service, Stop } from '@/types/service'
import { calcDistance } from '@/utils/utils'

// TODO: Replace any
interface XInt {
  dataset: string
  fields: Service
  geometry: { type: string; coordinates: number[] }
  record_timestamp: string
  recordid: string
}

export const useRealTimeStore = defineStore('realTime', {
  state: () => ({
    // MC
    realTimeMC: [],
    realTimeMCFields: [] as Service[],
    realTimeMCFieldsPP: [] as Service[],
    realTimeMCFieldsPPCoords: [] as Service[],
    // PE
    realTimePEDepartures: [] as Service[],
    realTimePEDeparturesFields: [] as Service[],
    // PE Arrivals
    realTimePEArrivals: [] as Service[],
    realTimePEArrivalsFields: [] as Service[],
    realTimePEArrivalsFieldsCoords: [] as Service[]
  }),
  getters: {
    getRealTimeMCFieldsPPCoords(state) {
      return state.realTimeMCFieldsPPCoords
    },
    getRealTimePEDeparturesFields(state) {
      return state.realTimePEDeparturesFields
    },
    getRealTimePEArrivalsFieldsCoords(state) {
      return state.realTimePEArrivalsFieldsCoords
    }
  },
  actions: {
    async fetchRealTimeMC() {
      try {
        const data = await axios.get(
          'https://fgc.opendatasoft.com/api/records/1.0/search/?dataset=posicionament-dels-trens&q=&rows=25&refine.desti=PE&exclude.lin=L8&exclude.lin=S3&exclude.lin=S9'
        )
        this.realTimeMC = data.data.records
        this.realTimeMCFields = this.realTimeMC.map((x) => x['fields'])
        this.realTimeMCFieldsPP = this.realTimeMCFields
          .map((x: Service) => {
            const replace = x.properes_parades.replace(/;/g, ',')
            const properes_parades_arr = '[' + replace + ']'

            x.next_stops = JSON.parse(properes_parades_arr)

            return x
          })
          .filter((x: Service) => {
            return x.next_stops.some((parada: Stop) => parada.parada === 'MC')
          })

        this.realTimeMCFieldsPPCoords = this.realTimeMCFieldsPP.map((item: Service) => {
          // MC
          const sCoords = {
            latitude: 41.48016575754757,
            longitude: 1.921882428721086
          }

          // Item
          const dCoords = {
            latitude: item.geo_point_2d[0],
            longitude: item.geo_point_2d[1]
          }
          const dist = calcDistance(sCoords, dCoords)

          item.distance = Math.round(dist * 100) / 100

          return item
        })
      } catch (error) {
        alert(error)
        console.log(error)
      }
    },
    async fetchRealTimePEDepartures() {
      try {
        const data = await axios.get(
          'https://fgc.opendatasoft.com/api/records/1.0/search/?dataset=posicionament-dels-trens&q=&rows=25&refine.estacionat_a=PE&exclude.desti=PE&exclude.lin=L8&exclude.lin=S3&exclude.lin=S9'
        )
        this.realTimePEDepartures = data.data.records
        this.realTimePEDeparturesFields = this.realTimePEDepartures.map((x: any) => {
          // TODO: Replace any
          return x['fields']
        })
      } catch (error) {
        alert(error)
        console.log(error)
      }
    },
    async fetchRealTimePEArrivals() {
      try {
        const data = await axios.get(
          'https://fgc.opendatasoft.com/api/records/1.0/search/?dataset=posicionament-dels-trens&q=&rows=25&refine.desti=PE'
        )
        this.realTimePEArrivals = data.data.records
        this.realTimePEArrivalsFields = this.realTimePEArrivals.map((x: any) => x['fields']) // TODO: Replace any
        this.realTimePEArrivalsFieldsCoords = this.realTimePEArrivalsFields.map((item: Service) => {
          // PE
          const sCoords = {
            latitude: 41.374401614337785,
            longitude: 2.148548273334978
          }

          // Item
          const dCoords = {
            latitude: item.geo_point_2d[0],
            longitude: item.geo_point_2d[1]
          }
          const dist = calcDistance(sCoords, dCoords)

          item.distance = Math.round(dist * 100) / 100

          return item
        })
      } catch (error) {
        alert(error)
        console.log(error)
      }
    }
  }
})
