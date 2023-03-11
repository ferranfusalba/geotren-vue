<template>
  <main>
    <h2>Origin PE</h2>
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
        <embed type="image/jpg" src="https://geotren.fgc.cat/isic/pe" width="100%">
    </picture>
    <EasyDataTable :headers="headers" :items="getScheduleTable" :sort-by="sortBy" :sort-type="sortType"/>
    <br>
    <br>
  </main>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useRealTimeStore } from "../stores/users";
import { useScheduleStore } from "../stores/schedule";

import type { Header, SortType } from "vue3-easy-data-table";

const sortBy = "departure_time";
const sortType: SortType = "asc";

const headers: Header[] = [
  { text: "Departure", value: "departure_time", sortable: true },
  { text: "Route", value: "route_short_name"},
  { text: "Headsign", value: "trip_headsign"},
];

const realTimestore = useRealTimeStore();
const getRealTime = computed(() => {
  return realTimestore.getRealTime;
});

console.log('getRealTime', getRealTime)

const scheduleStore = useScheduleStore();
const getScheduleTable = computed(() => {
  return scheduleStore.getScheduleTable;
});

console.log('getScheduleTable', getScheduleTable)

// TODO: Integrate time filtering & printed real time
var today = new Date();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

console.log('time', time);

onMounted(() => {
  realTimestore.fetchRealTime();
  scheduleStore.fetchSchedule();
});

</script>