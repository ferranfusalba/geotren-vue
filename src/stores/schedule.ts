import { defineStore } from 'pinia'
import axios from 'axios'
import type { DayType } from '@/data/fgcTimetable'
import type { Fields, MergedScheduleRow } from '@/types/schedule'
import { crossCheckSchedule } from '@/utils/crosscheck'
import { detectDayType, POPULATIONS, toMinutes, tripsFor } from '@/utils/timetable'

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
    /** The pattern the API's own data matched today; the e8 calendar is checked against it. */
    dayType: 'weekday' as DayType,
    scheduleMC: [] as MergedScheduleRow[],
    scheduleQC: [] as MergedScheduleRow[],
    schedulePE: [] as MergedScheduleRow[]
  }),
  getters: {
    getScheduleMC(state) {
      return state.scheduleMC
    },
    getScheduleQC(state) {
      return state.scheduleQC
    },
    getSchedulePE(state) {
      return state.schedulePE
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
        const dayType = detectDayType(apiTimes, POPULATIONS.MC)
        const trips = tripsFor(dayType, POPULATIONS.MC)

        // The whole service day is kept: the API returns it anyway, and the view
        // decides whether to show the trains that have already gone.
        this.scheduleMC = crossCheckSchedule(dataResults, trips, POPULATIONS.MC.station)
      } catch (error) {
        alert(error)
        console.log(error)
      }
    },
    async fetchScheduleQC() {
      try {
        const dataResults = await fetchAllPages(
          'https://dadesobertes.fgc.cat/api/explore/v2.1/catalog/datasets/viajes-de-hoy/records?refine=parent_station%3AQC&exclude=trip_headsign%3ABarcelona%20-%20Pla%C3%A7a%20Espanya'
        )

        // Narrowed to trains that go on to Martorell Central; the three that
        // terminate at Quatre Camins are dropped rather than flagged as missing.
        const apiTimes = dataResults.map((x) => toMinutes(x.departure_time))
        this.dayType = detectDayType(apiTimes, POPULATIONS.QC_TO_MC)
        const trips = tripsFor(this.dayType, POPULATIONS.QC_TO_MC)

        this.scheduleQC = crossCheckSchedule(
          dataResults.filter((x) => x.trip_headsign !== 'Quatre Camins'),
          trips,
          POPULATIONS.QC_TO_MC.station
        )
      } catch (error) {
        alert(error)
        console.log(error)
      }
    },
    async fetchSchedulePE() {
      try {
        const dataResults = await fetchAllPages(
          'https://dadesobertes.fgc.cat/api/explore/v2.1/catalog/datasets/viajes-de-hoy/records?refine=parent_station%3APE&exclude=trip_headsign%3ABarcelona%20-%20Pla%C3%A7a%20Espanya&exclude=route_short_name%3AL8&exclude=route_short_name%3AS3&exclude=route_short_name%3AS9'
        )

        // POPULATIONS.PE mirrors the exclusions above, so the poster is narrowed
        // to the same trains before the two are diffed.
        const apiTimes = dataResults.map((x) => toMinutes(x.departure_time))
        const dayType = detectDayType(apiTimes, POPULATIONS.PE)
        const trips = tripsFor(dayType, POPULATIONS.PE)

        this.schedulePE = crossCheckSchedule(dataResults, trips, POPULATIONS.PE.station)
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
      this.scheduleQC = []
      this.schedulePE = []
    },
    cleanScheduledStoreMC() {
      this.time = ''
      this.scheduleMC = []
    },
    cleanScheduledStoreQC() {
      this.time = ''
      this.scheduleQC = []
    },
    cleanScheduledStorePE() {
      this.time = ''
      this.schedulePE = []
    }
  }
})
