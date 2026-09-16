import { defineStore } from 'pinia'
import axios from 'axios'
import type { Fields, MergedScheduleRow } from '@/types/schedule'
import { crossCheckSchedule } from '@/utils/crosscheck'
import { detectDayType, toMinutes, tripsFor } from '@/utils/timetable'

const PAGE_SIZE = 100
const MAX_PAGES = 5

/**
 * The dataset returns more departures than one page holds (a weekday at MC is
 * ~123) and its default ordering is not chronological, so a single capped
 * request drops an arbitrary handful of trains. Page through the lot instead.
 */
const fetchAllPages = async (url: string): Promise<Fields[]> => {
  const results: Fields[] = []
  let total = Infinity

  for (let page = 0; results.length < total && page < MAX_PAGES; page += 1) {
    const { data } = await axios.get(
      `${url}&order_by=departure_time&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`
    )
    total = data.total_count
    results.push(...data.results)
  }

  return results
}

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    time: '',
    scheduleMC: [] as MergedScheduleRow[],
    scheduleQCTimeFiltered: [] as Fields[],
    schedulePETimeFiltered: [] as Fields[]
  }),
  getters: {
    getScheduleMC(state) {
      return state.scheduleMC
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
        const dataResults = await fetchAllPages(
          'https://dadesobertes.fgc.cat/api/explore/v2.1/catalog/datasets/viajes-de-hoy/records?refine=trip_headsign%3ABarcelona%20-%20Pla%C3%A7a%20Espanya&refine=parent_station%3AMC'
        )

        // The query asks for trains calling at MC on their way to Pl. Espanya, so
        // the poster is narrowed to the same population before the two are diffed.
        const apiTimes = dataResults.map((x) => toMinutes(x.departure_time))
        const dayType = detectDayType(apiTimes, 'MC', 'inbound')
        const trips = tripsFor(dayType, 'inbound', ['MC', 'PE'])

        // The whole service day is kept: the API returns it anyway, and the view
        // decides whether to show the trains that have already gone.
        this.scheduleMC = crossCheckSchedule(dataResults, trips, 'MC')
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
      this.scheduleMC = []
      this.scheduleQCTimeFiltered = []
      this.schedulePETimeFiltered = []
    },
    cleanScheduledStoreMC() {
      this.time = ''
      this.scheduleMC = []
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
