<template>
  <main>
    <h2>Origin MC</h2>
    <p>{{ currentDate }}</p>
    <EasyDataTable :headers="scheduleMCHeaders" :items="scheduleMCTimeFiltered" :sort-by="sortBy" :sort-type="sortType"
      :rows-per-page="10" table-class-name="customize-table" />
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

const scheduleMCHeaders: Header[] = [
  { text: "Departure", value: "departure_time", sortable: true },
  { text: "Route", value: "route_short_name" },
  { text: "Left", value: "trip_headsign" },
];

const scheduleStore = useScheduleStore();
const scheduleMCTimeFiltered = computed(() => {
  return scheduleStore.getScheduleMCTimeFiltered;
});
const currentDate = computed(() => {
  return scheduleStore.getCurrentDate;
});

onMounted(() => {
  scheduleStore.fetchTime();
  scheduleStore.fetchScheduleMC();
  scheduleStore.fetchRealTime();
});
</script>

<style scoped lang="scss">
main {
  padding-bottom: 3.75rem;
}
</style>