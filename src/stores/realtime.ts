import { defineStore } from 'pinia'
import axios from "axios"
export const useRealTimeStore = defineStore("realTime", {
    state: () => ({
      realTime: [],
      realTimeFields: []
    }),
    getters: {
      getRealTime(state){
          return state.realTime
      },
      getRealTimeFields(state){
        return state.realTimeFields
    },
    },
    actions: {
      async fetchRealTime() {
        try {
          const data = await axios.get('https://fgc.opendatasoft.com/api/records/1.0/search/?dataset=posicionament-dels-trens&q=&rows=25&refine.estacionat_a=PE&exclude.tipus_unitat=113&exclude.tipus_unitat=114&exclude.tipus_unitat=115&exclude.tipus_unitat=112&exclude.desti=PE&exclude.lin=RL1&exclude.lin=RL2&exclude.lin=L8&exclude.lin=S3&exclude.lin=S9')
            this.realTime = data.data.records;
            this.realTimeFields = this.realTime.map(x => x['fields']);
            console.log('this.realTime', this.realTime)
            console.log('this.realTimeFields', this.realTimeFields)
          }
          catch (error) {
            alert(error)
            console.log(error)
        }
      },
    },
})