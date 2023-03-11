import { defineStore } from 'pinia'
import axios from "axios"
export const useScheduleStore = defineStore("schedule", {
    state: () => ({
        schedulePE: [],
        schedulePETable: [],
        scheduleMC: [],
        scheduleMCTable: []
    }),
    getters: {
        getSchedulePE(state) {
            return state.schedulePE
        },
        getSchedulePETable(state) {
            return state.schedulePETable
        },
        getScheduleMC(state) {
            return state.scheduleMC
        },
        getScheduleMCTable(state) {
            return state.scheduleMCTable
        }
    },
    actions: {
      async fetchSchedulePE() {
        try {
            // config url: https://fgc.opendatasoft.com/explore/dataset/viajes-de-hoy/api/?rows=500&sort=&refine.stop_id=PE&exclude.route_short_name=L8&exclude.route_short_name=S3&exclude.route_short_name=S9&exclude.route_short_name=RL1&exclude.route_short_name=RL2&exclude.route_short_name=S1&exclude.route_short_name=S2&exclude.route_short_name=L6&exclude.route_short_name=L7&exclude.route_short_name=FV&exclude.route_short_name=L12&exclude.trip_headsign=Pl.+Espanya&exclude.trip_headsign=Montserrat&exclude.trip_headsign=Ribes-Enlla%C3%A7&exclude.trip_headsign=Nuria&exclude.trip_headsign=Monistrol+de+Montserrat&exclude.trip_headsign=Monistrol-Vila&dataChart=eyJxdWVyaWVzIjpbeyJjb25maWciOnsiZGF0YXNldCI6InZpYWplcy1kZS1ob3kiLCJvcHRpb25zIjp7fX0sImNoYXJ0cyI6W3siYWxpZ25Nb250aCI6dHJ1ZSwidHlwZSI6ImxpbmUiLCJmdW5jIjoiQVZHIiwieUF4aXMiOiJleGNlcHRpb25fdHlwZSIsInNjaWVudGlmaWNEaXNwbGF5Ijp0cnVlLCJjb2xvciI6IiM2NmMyYTUifV0sInhBeGlzIjoiZGF0ZSIsIm1heHBvaW50cyI6IiIsInRpbWVzY2FsZSI6InllYXIiLCJzb3J0IjoiIn1dLCJkaXNwbGF5TGVnZW5kIjp0cnVlLCJhbGlnbk1vbnRoIjp0cnVlfQ%3D%3D
          const data = await axios.get('https://fgc.opendatasoft.com/api/records/1.0/search/?dataset=viajes-de-hoy&q=&rows=500&refine.stop_id=PE&exclude.route_short_name=L8&exclude.route_short_name=S3&exclude.route_short_name=S9&exclude.route_short_name=RL1&exclude.route_short_name=RL2&exclude.route_short_name=S1&exclude.route_short_name=S2&exclude.route_short_name=L6&exclude.route_short_name=L7&exclude.route_short_name=FV&exclude.route_short_name=L12&exclude.trip_headsign=Pl.+Espanya&exclude.trip_headsign=Montserrat&exclude.trip_headsign=Ribes-Enlla%C3%A7&exclude.trip_headsign=Nuria&exclude.trip_headsign=Monistrol+de+Montserrat&exclude.trip_headsign=Monistrol-Vila')
            this.schedulePE = data.data.records
            this.schedulePETable = this.schedulePE.map(x => x['fields'])
          }
          catch (error) {
            alert(error)
            console.log(error)
        }
      },
      async fetchScheduleMC() {
        try {
            // config url: https://fgc.opendatasoft.com/explore/dataset/viajes-de-hoy/api/?rows=500&sort=&dataChart=eyJxdWVyaWVzIjpbeyJjb25maWciOnsiZGF0YXNldCI6InZpYWplcy1kZS1ob3kiLCJvcHRpb25zIjp7fX0sImNoYXJ0cyI6W3siYWxpZ25Nb250aCI6dHJ1ZSwidHlwZSI6ImxpbmUiLCJmdW5jIjoiQVZHIiwieUF4aXMiOiJleGNlcHRpb25fdHlwZSIsInNjaWVudGlmaWNEaXNwbGF5Ijp0cnVlLCJjb2xvciI6IiM2NmMyYTUifV0sInhBeGlzIjoiZGF0ZSIsIm1heHBvaW50cyI6IiIsInRpbWVzY2FsZSI6InllYXIiLCJzb3J0IjoiIn1dLCJkaXNwbGF5TGVnZW5kIjp0cnVlLCJhbGlnbk1vbnRoIjp0cnVlfQ%3D%3D&refine.stop_id=MC&exclude.route_short_name=L8&exclude.route_short_name=S3&exclude.route_short_name=S9&exclude.route_short_name=RL1&exclude.route_short_name=RL2&exclude.route_short_name=S1&exclude.route_short_name=S2&exclude.route_short_name=L6&exclude.route_short_name=L7&exclude.route_short_name=FV&exclude.route_short_name=L12&exclude.trip_headsign=Montserrat&exclude.trip_headsign=Ribes-Enlla%C3%A7&exclude.trip_headsign=Nuria&exclude.trip_headsign=Monistrol+de+Montserrat&exclude.trip_headsign=Monistrol-Vila&exclude.trip_headsign=Manresa-Baixador&exclude.trip_headsign=Igualada&exclude.trip_headsign=Olesa+de+Montserrat&exclude.trip_headsign=Martorell+Enlla%C3%A7
          const data = await axios.get('https://fgc.opendatasoft.com/api/records/1.0/search/?dataset=viajes-de-hoy&q=&rows=500&facet=route_short_name&refine.stop_id=MC&exclude.route_short_name=L8&exclude.route_short_name=S3&exclude.route_short_name=S9&exclude.route_short_name=RL1&exclude.route_short_name=RL2&exclude.route_short_name=S1&exclude.route_short_name=S2&exclude.route_short_name=L6&exclude.route_short_name=L7&exclude.route_short_name=FV&exclude.route_short_name=L12&exclude.trip_headsign=Montserrat&exclude.trip_headsign=Ribes-Enlla%C3%A7&exclude.trip_headsign=Nuria&exclude.trip_headsign=Monistrol+de+Montserrat&exclude.trip_headsign=Monistrol-Vila&exclude.trip_headsign=Manresa-Baixador&exclude.trip_headsign=Igualada&exclude.trip_headsign=Olesa+de+Montserrat&exclude.trip_headsign=Martorell+Enlla%C3%A7')
            this.scheduleMC = data.data.records
            this.scheduleMCTable = this.scheduleMC.map(x => x['fields'])
          }
          catch (error) {
            alert(error)
            console.log(error)
        }
      }
    },
})