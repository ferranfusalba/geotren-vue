import { createStore } from "vuex";
// import axios from "axios";

export default createStore({
  state: {
    trains: [],
  },
  mutations: {
    fillTrains(state, trainsInAction) {
      state.trains = trainsInAction;
    },
  },
  actions: { /*
    getTrains() {
      axios
        .get(
          "https://dadesobertes.fgc.cat/api/records/1.0/search/?dataset=posicionament-dels-trens&q=&rows=90"
        )
        .then(function (response) {
          // handle success
          console.log(response);
          console.log(response.data.records);
          this.resData = response.data.records;
          // console.log(response.data.records);
        })
        .catch(function (error) {
          // handle error
          console.log(error);
        })
        .then(function () {
          // always executed
        });
    }, */
    getTrains: async function({ commit }) {
        const data = await fetch("https://dadesobertes.fgc.cat/api/records/1.0/search/?dataset=posicionament-dels-trens&q=&rows=120");
        const trains = await data.json();
        commit("fillTrains", trains);
    },
  },
  modules: {},
});
