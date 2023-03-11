import { defineStore } from 'pinia'
import axios from "axios"
export const useScheduleStore = defineStore("schedule", {
    state: () => ({
        schedule: []
    }),
    getters: {
      getSchedule(state){
          return state.schedule
        }
    },
    actions: {
      async fetchSchedule() {
        try {
          const data = await axios.get('https://fgc.opendatasoft.com/api/records/1.0/search/?dataset=viajes-de-hoy&q=&rows=500&refine.stop_id=PE&exclude.route_short_name=L8&exclude.route_short_name=S3&exclude.route_short_name=S9&exclude.route_short_name=RL1&exclude.route_short_name=RL2&exclude.route_short_name=S1&exclude.route_short_name=S2&exclude.route_short_name=L6&exclude.route_short_name=L7&exclude.route_short_name=FV&exclude.route_short_name=L12&exclude.trip_headsign=Pl.+Espanya&exclude.trip_headsign=Montserrat&exclude.trip_headsign=Ribes-Enlla%C3%A7&exclude.trip_headsign=Nuria&exclude.trip_headsign=Monistrol+de+Montserrat&exclude.trip_headsign=Monistrol-Vila')
            this.schedule = data.data.records
            console.log('data', data);
            console.log('this.schedule', this.schedule);
          }
          catch (error) {
            alert(error)
            console.log(error)
        }
      }
    },
})