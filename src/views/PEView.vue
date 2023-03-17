<template>
  <main>
    <h2>Origin PE</h2>
    <!-- <p>{{getTime}}</p> -->
    <table>
      <tr>
        <th>Line</th>
        <th>Dest.</th>
        <th>Dir.</th>
        <th>Est.</th>
        <th>UT</th>
      </tr>
      <tr v-for="item in getRealTime" :key="item['id']">
        <td>{{ item['fields']['lin'] }}</td>
        <td>{{ item['fields']['desti'] }}</td>
        <td>{{ item['fields']['dir'] }}</td>
        <td>{{ item['fields']['estacionat_a'] }}</td>
        <td>{{ item['fields']['tipus_unitat'] }}</td>
      </tr>
    </table>
    <picture>
        <embed type="image/png" src="https://geotren.fgc.cat/isic/pe" width="100%">
    </picture>
    <EasyDataTable :headers="headers" :items="getFilteredPETable" :sort-by="sortBy" :sort-type="sortType" :rows-per-page="5" table-class-name="customize-table"/>
    <br>
    <br>
  </main>
</template>

<script setup lang="ts">
// Vue
import { onMounted, computed } from "vue";
// Pinia Store
import { useRealTimeStore } from "../stores/realtime";
import { useScheduleStore } from "../stores/schedule";
// Table
import type { Header, SortType } from "vue3-easy-data-table";

const sortBy = "departure_time";
const sortType: SortType = "asc";
const headers: Header[] = [
  { text: "Departure", value: "departure_time", sortable: true },
  { text: "Route", value: "route_short_name" },
  { text: "Headsign", value: "trip_headsign" },
];


const realTimestore = useRealTimeStore();
const getRealTime = computed(() => {
  return realTimestore.getRealTime;
});
// const getTime = computed(() => {
//   return scheduleStore.getTime;
// })

const scheduleStore = useScheduleStore();
// const getSchedulePETable = computed(() => {
//   return scheduleStore.getSchedulePETable;
// });
const getFilteredPETable = computed(() => {
  return scheduleStore.getFilteredPETable;
});

// TODO: Get two digit seconds, Integrate time filtering on table (delete past trains), print real time, get next train (countdown)
// var today = new Date();
// var hours = today.getHours() < 10 ? '0' + today.getHours() : today.getHours();
// var minutes = today.getMinutes() < 10 ? '0' + today.getMinutes() : today.getMinutes();
// var seconds = today.getSeconds() < 10 ? '0' + today.getSeconds() : today.getSeconds();
// var time = hours + ":" + minutes + ":" + seconds;
// console.log('time', time);

onMounted(() => {
  realTimestore.fetchRealTime();
  scheduleStore.fetchTime();
  scheduleStore.fetchSchedulePE();
});

</script>