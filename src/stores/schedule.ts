import { defineStore } from 'pinia'
import axios from 'axios'

function toSeconds(time_str: string) {
  const parts: Array<string> = time_str.split(':')
  return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + +Number(parts[2])
}

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    time: '',
    realTime: '',
    currentDate: new Date(),
    // MC
    scheduleMC: [],
    scheduleMCFields: [],
    scheduleMCTimeFiltered: [] as object,
    scheduleMCTimeLeft: [] as object,
    // QC
    scheduleQC: [],
    scheduleQCFields: [],
    scheduleQCTimeFiltered: [] as object,
    scheduleQCTimeLeft: [] as object,
    // PE
    schedulePE: [],
    schedulePEFields: [],
    schedulePETimeFiltered: [] as object,
    schedulePETimeLeft: [] as object
  }),
  getters: {
    getTime(state) {
      return state.time
    },
    getRealTime(state) {
      return state.realTime
    },
    getCurrentDate(state) {
      return state.currentDate
    },
    // MC
    getScheduleMC(state) {
      return state.scheduleMC
    },
    getScheduleMCFields(state) {
      return state.scheduleMCFields
    },
    getScheduleMCTimeFiltered(state) {
      return state.scheduleMCTimeFiltered
    },
    // QC
    getScheduleQC(state) {
      return state.scheduleQC
    },
    getScheduleQCFields(state) {
      return state.scheduleQCFields
    },
    getScheduleQCTimeFiltered(state) {
      return state.scheduleQCTimeFiltered
    },
    // PE
    getSchedulePE(state) {
      return state.schedulePE
    },
    getschedulePEFields(state) {
      return state.schedulePEFields
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
          'https://fgc.opendatasoft.com/api/records/1.0/search/?dataset=viajes-de-hoy&q=&rows=500&facet=route_short_name&refine.stop_id=MC&exclude.route_short_name=L8&exclude.route_short_name=S3&exclude.route_short_name=S9&exclude.route_short_name=RL1&exclude.route_short_name=RL2&exclude.route_short_name=S1&exclude.route_short_name=S2&exclude.route_short_name=L6&exclude.route_short_name=L7&exclude.route_short_name=FV&exclude.route_short_name=L12&exclude.trip_headsign=Montserrat&exclude.trip_headsign=Ribes-Enlla%C3%A7&exclude.trip_headsign=Nuria&exclude.trip_headsign=Monistrol+de+Montserrat&exclude.trip_headsign=Monistrol-Vila&exclude.trip_headsign=Manresa-Baixador&exclude.trip_headsign=Igualada&exclude.trip_headsign=Olesa+de+Montserrat&exclude.trip_headsign=Martorell+Enlla%C3%A7'
        )
        this.scheduleMC = data.data.records
        this.scheduleMCFields = this.scheduleMC.map((x) => x['fields'])

        this.scheduleMCTimeFiltered = this.scheduleMCFields
          .map((x) => {
            if ((x['departure_time'] as string) >= this.time) {
              return x
            }
          })
          .filter((notUndefined) => notUndefined !== undefined)

        const values = Object.values(this.scheduleMCTimeFiltered)

        this.scheduleMCTimeLeft = values.map((x) => {
          const diff = Math.abs(toSeconds(x['departure_time']) - toSeconds(this.time))
          const result = [Math.floor(diff / 3600), Math.floor((diff % 3600) / 60), diff % 60]
          const timeResult = result
            .map(function (v) {
              return v < 10 ? '0' + v : v
            })
            .join(':')

          x['left_str'] = timeResult
          return x
        })
      } catch (error) {
        alert(error)
        console.log(error)
      }
    },
    async fetchScheduleQC() {
      try {
        const data = await axios.get(
          'https://fgc.opendatasoft.com/api/explore/v2.1/catalog/datasets/viajes-de-hoy/records?limit=100&refine=stop_id%3AQC&exclude=trip_headsign%3APl.%20Espanya'
        )
        this.scheduleQC = data.data.results

        this.scheduleQCTimeFiltered = this.scheduleQC
          .map((x) => {
            if ((x['departure_time'] as string) >= this.time) {
              return x
            }
          })
          .filter((notUndefined) => notUndefined !== undefined)
      } catch (error) {
        alert(error)
        console.log(error)
      }
    },
    async fetchSchedulePE() {
      try {
        // config url: https://fgc.opendatasoft.com/explore/dataset/viajes-de-hoy/api/?rows=500&sort=&refine.stop_id=PE&exclude.route_short_name=L8&exclude.route_short_name=S3&exclude.route_short_name=S9&exclude.route_short_name=RL1&exclude.route_short_name=RL2&exclude.route_short_name=S1&exclude.route_short_name=S2&exclude.route_short_name=L6&exclude.route_short_name=L7&exclude.route_short_name=FV&exclude.route_short_name=L12&exclude.trip_headsign=Pl.+Espanya&exclude.trip_headsign=Montserrat&exclude.trip_headsign=Ribes-Enlla%C3%A7&exclude.trip_headsign=Nuria&exclude.trip_headsign=Monistrol+de+Montserrat&exclude.trip_headsign=Monistrol-Vila&dataChart=eyJxdWVyaWVzIjpbeyJjb25maWciOnsiZGF0YXNldCI6InZpYWplcy1kZS1ob3kiLCJvcHRpb25zIjp7fX0sImNoYXJ0cyI6W3siYWxpZ25Nb250aCI6dHJ1ZSwidHlwZSI6ImxpbmUiLCJmdW5jIjoiQVZHIiwieUF4aXMiOiJleGNlcHRpb25fdHlwZSIsInNjaWVudGlmaWNEaXNwbGF5Ijp0cnVlLCJjb2xvciI6IiM2NmMyYTUifV0sInhBeGlzIjoiZGF0ZSIsIm1heHBvaW50cyI6IiIsInRpbWVzY2FsZSI6InllYXIiLCJzb3J0IjoiIn1dLCJkaXNwbGF5TGVnZW5kIjp0cnVlLCJhbGlnbk1vbnRoIjp0cnVlfQ%3D%3D
        const data = await axios.get(
          'https://fgc.opendatasoft.com/api/records/1.0/search/?dataset=viajes-de-hoy&q=&rows=500&refine.stop_id=PE&exclude.route_short_name=L8&exclude.route_short_name=S3&exclude.route_short_name=S9&exclude.route_short_name=RL1&exclude.route_short_name=RL2&exclude.route_short_name=S1&exclude.route_short_name=S2&exclude.route_short_name=L6&exclude.route_short_name=L7&exclude.route_short_name=FV&exclude.route_short_name=L12&exclude.trip_headsign=Pl.+Espanya&exclude.trip_headsign=Montserrat&exclude.trip_headsign=Ribes-Enlla%C3%A7&exclude.trip_headsign=Nuria&exclude.trip_headsign=Monistrol+de+Montserrat&exclude.trip_headsign=Monistrol-Vila'
        )
        this.schedulePE = data.data.records
        this.schedulePEFields = this.schedulePE.map((x) => x['fields'])

        this.schedulePETimeFiltered = this.schedulePEFields
          .map((x) => {
            if ((x['departure_time'] as string) >= this.time) {
              return x
            }
          })
          .filter((notUndefined) => notUndefined !== undefined)

        const values = Object.values(this.schedulePETimeFiltered)

        this.schedulePETimeLeft = values.map((x) => {
          const diff = Math.abs(toSeconds(x['departure_time']) - toSeconds(this.time))
          const result = [Math.floor(diff / 3600), Math.floor((diff % 3600) / 60), diff % 60]
          const timeResult = result
            .map(function (v) {
              return v < 10 ? '0' + v : v
            })
            .join(':')

          x['left_str'] = timeResult
          return x
        })
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
    fetchRealTime() {
      setInterval(() => {
        const date = new Date()
        const hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
        const minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
        const seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()
        const time = hours + ':' + minutes + ':' + seconds
        this.realTime = time
        this.currentDate = date
      }, 1000)
    }
  }
})
