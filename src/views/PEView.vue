<template>
  <main>
    <h2>Origin PE</h2>
    <EasyDataTable :headers="realTimePEHeaders" :items="realTimePEFields" :hide-footer="true"
      table-class-name="customize-table" style="--6c2c1440: 0;" />
    <picture>
      <embed type="image/png" src="https://geotren.fgc.cat/isic/pe" width="100%">
    </picture>
    <EasyDataTable :headers="schedulePEHeaders" :items="schedulePETimeFiltered" :sort-by="sortBy" :sort-type="sortType"
      :rows-per-page="5" table-class-name="customize-table" />
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
const realTimePEHeaders: Header[] = [
  { text: "Unit", value: "tipus_unitat" },
  { text: "Line", value: "lin" },
  { text: "Destination", value: "desti" }
];
const schedulePEHeaders: Header[] = [
  { text: "Departure", value: "departure_time", sortable: true },
  { text: "Route", value: "route_short_name" },
  { text: "Left", value: "left_str" },
];


const realTimeStore = useRealTimeStore();
const realTimePEFields = computed(() => {
  return realTimeStore.getRealTimePEFields;
});

const scheduleStore = useScheduleStore();
const schedulePETimeFiltered = computed(() => {
  return scheduleStore.getSchedulePETimeFiltered;
});

onMounted(() => {
  realTimeStore.fetchRealTimePE();
  scheduleStore.fetchTime();
  scheduleStore.fetchSchedulePE();
});

</script>

<style scoped lang="scss">
main {
  padding-bottom: 3.75rem;
}
</style>