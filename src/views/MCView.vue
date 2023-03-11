<template>
  <main>
    <h2>Origin MC</h2>
    <EasyDataTable :headers="headers" :items="getScheduleMCTable" :sort-by="sortBy" :sort-type="sortType" :rows-per-page="10"/>
  </main>
</template>

<script setup lang="ts">
// Vue
import { onMounted, computed } from "vue";
// Pinia Store
import { useScheduleStore } from "../stores/schedule";
// Table
import type { Header, SortType } from "vue3-easy-data-table";

const sortBy = "departure_time";
const sortType: SortType = "asc";

const headers: Header[] = [
  { text: "Departure", value: "departure_time", sortable: true },
  { text: "Route", value: "route_short_name"},
  { text: "Headsign", value: "trip_headsign"},
];

const scheduleStore = useScheduleStore();
const getScheduleMCTable = computed(() => {
  return scheduleStore.getScheduleMCTable;
});
console.log('getScheduleMCTable', getScheduleMCTable);

onMounted(() => {
  scheduleStore.fetchScheduleMC();
});

</script>