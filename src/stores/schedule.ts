import { defineStore } from 'pinia'
import axios from 'axios'
import type { Fields, ScheduleRecordsItem } from '@/types/schedule'

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
        // config url: https://fgc.opendatasoft.com/explore/dataset/viajes-de-hoy/api/?rows=500&sort=&dataChart=eyJxdWVyaWVzIjpbeyJjb25maWciOnsiZGF0YXNldCI6InZpYWplcy1kZS1ob3kiLCJvcHRpb25zIjp7fX0sImNoYXJ0cyI6W3siYWxpZ25Nb250aCI6dHJ1ZSwidHlwZSI6ImxpbmUiLCJmdW5jIjoiQVZHIiwieUF4aXMiOiJleGNlcHRpb25fdHlwZSIsInNjaWVudGlmaWNEaXNwbGF5Ijp0cnVlLCJjb2xvciI6IiM2NmMyYTUifV0sInhBeGlzIjoiZGF0ZSIsIm1heHBvaW50cyI6IiIsInRpbWVzY2FsZSI6InllYXIiLCJzb3J0IjoiIn1dLCJkaXNwbGF5TGVnZW5kIjp0cnVlLCJhbGlnbk1vbnRoIjp0cnVlfQ%3D%3D&refine.stop_id=MC&exclude.route_short_name=L8&exclude.route_short_name=S3&exclude.route_short_name=S9&exclude.route_short_name=RL1&exclude.route_short_name=RL2&exclude.route_short_name=S1&exclude.route_short_name=S2&exclude.route_short_name=L6&exclude.route_short_name=L7&exclude.route_short_name=FV&exclude.route_short_name=L12&exclude.trip_headsign=Montserrat&exclude.trip_headsign=Ribes-Enlla%C3%A7&exclude.trip_headsign=Nuria&exclude.trip_headsign=Monistrol+de+Montserrat&exclude.trip_headsign=Monistrol-Vila&exclude.trip_headsign=Manresa-Baixador&exclude.trip_headsign=Igualada&exclude.trip_headsign=Olesa+de+Montserrat&exclude.trip_headsign=Martorell+Enlla%C3%A7
        const data = await axios.get(
          'https://fgc.opendatasoft.com/api/records/1.0/search/?dataset=viajes-de-hoy&q=&rows=500&facet=route_short_name&refine.stop_id=MC&exclude.trip_headsign=Manresa-Baixador&exclude.trip_headsign=Igualada&exclude.trip_headsign=Olesa+de+Montserrat&exclude.trip_headsign=Martorell+Enlla%C3%A7'
        )

        const dataRecords = data.data.records
        const fields = dataRecords.map((x: ScheduleRecordsItem) => x['fields'])

        this.scheduleMCTimeFiltered = fields
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
          'https://fgc.opendatasoft.com/api/records/1.0/search/?dataset=viajes-de-hoy&q=&rows=500&facet=route_short_name&refine.stop_id=QC&exclude.trip_headsign=Pl.+Espanya&exclude.route_short_name=S9'
        )

        const dataRecords = data.data.records
        const fields = dataRecords.map((x: ScheduleRecordsItem) => x['fields'])

        this.scheduleQCTimeFiltered = fields
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
        // config url: https://fgc.opendatasoft.com/explore/dataset/viajes-de-hoy/api/?rows=500&sort=&refine.stop_id=PE&exclude.route_short_name=L8&exclude.route_short_name=S3&exclude.route_short_name=S9&exclude.route_short_name=RL1&exclude.route_short_name=RL2&exclude.route_short_name=S1&exclude.route_short_name=S2&exclude.route_short_name=L6&exclude.route_short_name=L7&exclude.route_short_name=FV&exclude.route_short_name=L12&exclude.trip_headsign=Pl.+Espanya&exclude.trip_headsign=Montserrat&exclude.trip_headsign=Ribes-Enlla%C3%A7&exclude.trip_headsign=Nuria&exclude.trip_headsign=Monistrol+de+Montserrat&exclude.trip_headsign=Monistrol-Vila&dataChart=eyJxdWVyaWVzIjpbeyJjb25maWciOnsiZGF0YXNldCI6InZpYWplcy1kZS1ob3kiLCJvcHRpb25zIjp7fX0sImNoYXJ0cyI6W3siYWxpZ25Nb250aCI6dHJ1ZSwidHlwZSI6ImxpbmUiLCJmdW5jIjoiQVZHIiwieUF4aXMiOiJleGNlcHRpb25fdHlwZSIsInNjaWVudGlmaWNEaXNwbGF5Ijp0cnVlLCJjb2xvciI6IiM2NmMyYTUifV0sInhBeGlzIjoiZGF0ZSIsIm1heHBvaW50cyI6IiIsInRpbWVzY2FsZSI6InllYXIiLCJzb3J0IjoiIn1dLCJkaXNwbGF5TGVnZW5kIjp0cnVlLCJhbGlnbk1vbnRoIjp0cnVlfQ%3D%3D
        const data = await axios.get(
          'https://fgc.opendatasoft.com/api/records/1.0/search/?dataset=viajes-de-hoy&q=&rows=500&refine.stop_id=PE&exclude.route_short_name=L8&exclude.route_short_name=S3&exclude.route_short_name=S9&exclude.trip_headsign=Pl.+Espanya'
        )

        const dataRecords = data.data.records
        const fields = dataRecords.map((x: ScheduleRecordsItem) => x['fields'])

        this.schedulePETimeFiltered = fields
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
    }
  }
})
