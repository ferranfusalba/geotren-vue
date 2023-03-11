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
    <EasyDataTable :headers="headers" :items="getScheduleTable" :sort-by="sortBy" :sort-type="sortType"/>
    <table>
      <tr>
        <!-- <th>date</th> -->
        <th>departure</th>
        <!-- <th>arrival</th> -->
        <th>route</th>
        <!-- <th>col</th> -->
        <th>trip_headsign</th>
      </tr>
      <tr v-for="item in getSchedule" :key="item['id']">
        <!-- <td>{{ item['fields']['date'] }}</td> -->
        <td>{{ item['fields']['departure_time'] }}</td>
        <!-- <td>{{ item['fields']['arrival_time'] }}</td> -->
        <td>{{ item['fields']['route_short_name'] }}</td>
        <!-- <td>{{ item['fields']['route_color'] }}</td> -->
        <td>{{ item['fields']['trip_headsign'] }}</td>
      </tr>
    </table>
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

const scheduleStore = useScheduleStore();
const getSchedule = computed(() => {
  return scheduleStore.getSchedule;
});
const getScheduleTable = computed(() => {
  return scheduleStore.getScheduleTable;
});

onMounted(() => {
  realTimestore.fetchRealTime();
  scheduleStore.fetchSchedule();
});

</script>