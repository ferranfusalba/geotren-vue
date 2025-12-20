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
          'https://dadesobertes.fgc.cat/api/explore/v2.1/catalog/datasets/viajes-de-hoy/records?limit=100&refine=trip_headsign%3ABarcelona%20-%20Pla%C3%A7a%20Espanya&refine=parent_station%3AMC'
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
          'https://dadesobertes.fgc.cat/api/explore/v2.1/catalog/datasets/viajes-de-hoy/records?limit=100&refine=parent_station%3AQC&exclude=trip_headsign%3ABarcelona%20-%20Pla%C3%A7a%20Espanya'
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
          'https://dadesobertes.fgc.cat/api/explore/v2.1/catalog/datasets/viajes-de-hoy/records?limit=100&refine=parent_station%3APE&exclude=trip_headsign%3ABarcelona%20-%20Pla%C3%A7a%20Espanya&exclude=route_short_name%3AL8&exclude=route_short_name%3AS3&exclude=route_short_name%3AS9'
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
