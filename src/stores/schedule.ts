import { defineStore } from 'pinia'
import axios from 'axios'
import type { Fields } from '@/types/schedule'

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    time: '',
    scheduleMCTimeFiltered: [] as Fields[],
    scheduleQCTimeFiltered: [] as Fields[],
    schedulePETimeFiltered: [] as Fields[]
  }),
  getters: {
    getScheduleMCTimeFiltered(state) {
      return state.scheduleMCTimeFiltered
    },
    getScheduleQCTimeFiltered(state) {
      return state.scheduleQCTimeFiltered
    },
    getSchedulePETimeFiltered(state) {
      return state.schedulePETimeFiltered
    }
  },
  actions: {
    async fetchScheduleMC() {
      try {
        const data = await axios.get(
          'https://fgc.opendatasoft.com/api/explore/v2.1/catalog/datasets/viajes-de-hoy/records?limit=100&refine=stop_id%3AMC&refine=trip_headsign%3ABarcelona%20-%20Pla%C3%A7a%20Espanya'
        )

        const dataResults = data.data.results

        this.scheduleMCTimeFiltered = dataResults
          .map((x: Fields) => {
            if ((x['departure_time'] as string) >= this.time) {
              return x
            }
          })
          .filter((notUndefined: Fields) => notUndefined !== undefined)
      } catch (error) {
        alert(error)
        console.log(error)
      }
    },
    async fetchScheduleQC() {
      try {
        const data = await axios.get(
          'https://fgc.opendatasoft.com/api/explore/v2.1/catalog/datasets/viajes-de-hoy/records?where=stop_id%20%3D%20%22QC%22%20and%20route_short_name%20!%3D%20%22S9%22%20and%20trip_headsign%20!%3D%20%22Barcelona%20-%20Pla%C3%A7a%20Espanya%22&limit=100'
        )

        const dataResults = data.data.results

        this.scheduleQCTimeFiltered = dataResults
          .map((x: Fields) => {
            if ((x['departure_time'] as string) >= this.time) {
              return x
            }
          })
          .filter((notUndefined: Fields) => notUndefined !== undefined)
      } catch (error) {
        alert(error)
        console.log(error)
      }
    },
    async fetchSchedulePE() {
      try {
        const data = await axios.get(
          'https://fgc.opendatasoft.com/api/explore/v2.1/catalog/datasets/viajes-de-hoy/records?where=stop_id%20%3D%20%22PE%22%20and%20route_short_name%20!%3D%20%22L8%22%20and%20route_short_name%20!%3D%20%22S3%22%20and%20route_short_name%20!%3D%20%22S9%22%20and%20trip_headsign%20!%3D%20%22Barcelona%20-%20Pla%C3%A7a%20Espanya%22&limit=100'
        )

        const dataResults = data.data.results

        this.schedulePETimeFiltered = dataResults
          .map((x: Fields) => {
            if ((x['departure_time'] as string) >= this.time) {
              return x
            }
          })
          .filter((notUndefined: Fields) => notUndefined !== undefined)
      } catch (error) {
        alert(error)
        console.log(error)
      }
    },
    fetchTime() {
      const today = new Date()
      const hours = today.getHours() < 10 ? '0' + today.getHours() : today.getHours()
      const minutes = today.getMinutes() < 10 ? '0' + today.getMinutes() : today.getMinutes()
      const seconds = today.getSeconds() < 10 ? '0' + today.getSeconds() : today.getSeconds()
      const time = hours + ':' + minutes + ':' + seconds
      this.time = time
    },
    cleanScheduledStore() {
      this.time = ''
      this.scheduleMCTimeFiltered = []
      this.scheduleQCTimeFiltered = []
      this.schedulePETimeFiltered = []
    },
    cleanScheduledStoreMC() {
      this.time = ''
      this.scheduleMCTimeFiltered = []
    },
    cleanScheduledStoreQC() {
      this.time = ''
      this.scheduleQCTimeFiltered = []
    },
    cleanScheduledStorePE() {
      this.time = ''
      this.schedulePETimeFiltered = []
    }
  }
})
