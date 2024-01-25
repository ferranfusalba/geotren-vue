import { defineStore } from 'pinia'
import axios from 'axios'
import type { Service, Stop } from '@/types/service'

export const useRealTimeStore = defineStore('realTime', {
  state: () => ({
    // MC
    realTimeMC: [],
    realTimeMCFields: [],
    realTimeMCFieldsPP: [] as unknown,
    realTimeMCFieldsPPFiltered: [],
    // PE
    realTimePE: [],
    realTimePEFields: []
  }),
  getters: {
    getRealTimeMCFieldsPP(state) {
      return state.realTimeMCFieldsPP
    },
    getRealTimePEFields(state) {
      return state.realTimePEFields
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
            const arrayed = '[' + replace + ']'

            x.properes_parades_arr = JSON.parse(arrayed)

            return x
          })
          .filter((x: Service) => {
            // TODO: Filter by geolocation rather than encountered stops
            // MC coords:
            // Aprox: [41.48454435471246, 1.917750099201453]
            // Real?: [41.48016575754757, 1.921882428721086]
            return (
              x.properes_parades_arr &&
              Array.isArray(x.properes_parades_arr) &&
              x.properes_parades_arr.some((parada: Stop) => parada.parada === 'MC')
            )
          })
          .sort((a, b) => {
            const indexA = a.properes_parades_arr.findIndex(
              (parada: Stop) => parada.parada === 'MC'
            )
            const indexB = b.properes_parades_arr.findIndex(
              (parada: Stop) => parada.parada === 'MC'
            )

            return indexA - indexB
          })
      } catch (error) {
        alert(error)
        console.log(error)
      }
    },
    async fetchRealTimePE() {
      try {
        const data = await axios.get(
          'https://fgc.opendatasoft.com/api/records/1.0/search/?dataset=posicionament-dels-trens&q=&rows=25&refine.estacionat_a=PE&exclude.desti=PE&exclude.lin=L8&exclude.lin=S3&exclude.lin=S9'
        )
        this.realTimePE = data.data.records
        this.realTimePEFields = this.realTimePE.map((x) => x['fields'])
      } catch (error) {
        alert(error)
        console.log(error)
      }
    }
  }
})
