<template>
  <main>
    <EasyDataTable
      :headers="realTimeMCHeaders"
      :items="realTimeMCFields"
      :sort-by="sortByRealtime"
      :sort-type="sortTypeRealtime"
      :hide-footer="true"
      header-class-name="arrivals-table"
      table-class-name="arrivals-table main-table"
      style="--6c2c1440: 0"
      :rows-per-page="5"
    >
      <template #item-lin="item">
        <S4Logo v-if="item.lin === 'S4'" />
        <S8Logo v-if="item.lin === 'S8'" />
        <R5Logo v-if="item.lin === 'R5'" />
        <R50Logo v-if="item.lin === 'R5R'" />
        <R53Logo v-if="item.lin === 'R53'" />
        <R6Logo v-if="item.lin === 'R6'" />
        <R60Logo v-if="item.lin === 'R6R'" />
        <R63Logo v-if="item.lin === 'R61'" />
        <R63Logo v-if="item.lin === 'R62'" />
        <R63Logo v-if="item.lin === 'R63'" />
      </template>
      <template #item-estacionat_a="item">
        <span v-if="item.estacionat_a">{{ stations[item.estacionat_a] }}</span>
        <i v-else>{{ stations[item.next_stops[0].parada] }}</i>
      </template>
    </EasyDataTable>

    <button @click="fetcherMC()">Refresh</button>

    <EasyDataTable
      :headers="scheduleMCHeaders"
      :items="scheduleMCTimeFiltered"
      :sort-by="sortBySchedule"
      :sort-type="sortTypeSchedule"
      :rows-per-page="200"
      header-class-name="departures-table"
      table-class-name="main-table departures-table"
    >
      <template #item-departure_time="item">{{
        renderScheduledDepartureTime(item.departure_time)
      }}</template>
      <template #item-route_short_name="item">
        <S4Logo v-if="item.route_short_name === 'S4'" />
        <S8Logo v-if="item.route_short_name === 'S8'" />
        <R5Logo v-if="item.route_short_name === 'R5'" />
        <R50Logo v-if="item.route_short_name === 'R50'" />
        <R53Logo v-if="item.route_short_name === 'R53'" />
        <R6Logo v-if="item.route_short_name === 'R6'" />
        <R60Logo v-if="item.route_short_name === 'R60'" />
        <R63Logo v-if="item.route_short_name === 'R63'" />
      </template>
      <template #item-left_str="item">
        <CountdownCell :departure_time="item.departure_time"></CountdownCell>
      </template>
    </EasyDataTable>

    <div id="map"></div>
  </main>
</template>

<script setup lang="ts">
// Vue
import { onMounted, computed } from 'vue'
// Pinia Store
import { useRealTimeStore } from '../stores/realtime'
import { useScheduleStore } from '../stores/schedule'
// Leaflet
import "leaflet/dist/leaflet.css";
import leaflet from "leaflet";
// Table
import type { Header, SortType } from 'vue3-easy-data-table'
// Components
import CountdownCell from '../components/countdown/CountdownCell.vue'
// Assets
import S4Logo from '../components/lines/S4Logo.vue'
import S8Logo from '../components/lines/S8Logo.vue'
import R5Logo from '../components/lines/R5Logo.vue'
import R6Logo from '../components/lines/R6Logo.vue'
import R50Logo from '../components/lines/R50Logo.vue'
import R53Logo from '../components/lines/R53Logo.vue'
import R60Logo from '../components/lines/R60Logo.vue'
import R63Logo from '../components/lines/R63Logo.vue'
// Utils
import { stations } from '@/utils/stations'
import { renderScheduledDepartureTime } from '@/utils/utils'
import { mcMarker } from '@/stores/mapStore';

let map: leaflet.Map;

const sortByRealtime = 'distance'
const sortTypeRealtime: SortType = 'asc'
const realTimeMCHeaders: Header[] = [
  { text: 'Unit', value: 'tipus_unitat' },
  { text: 'Line', value: 'lin' },
  { text: 'Oc.', value: 'ocupacio_m1_percent' },
  { text: 'Location', value: 'estacionat_a' },
  { text: 'Dist.', value: 'distance' }
]

const sortBySchedule = 'departure_time'
const sortTypeSchedule: SortType = 'asc'
const scheduleMCHeaders: Header[] = [
  { text: 'Departure', value: 'departure_time', sortable: false },
  { text: 'Line', value: 'route_short_name' },
  { text: 'Left', value: 'left_str', width: 84 }
]

const realTimeStore = useRealTimeStore()
const realTimeMCFields = computed(() => {
  return realTimeStore.getRealTimeMCFieldsPPCoords
})

const scheduleStore = useScheduleStore()
const scheduleMCTimeFiltered = computed(() => {
  return scheduleStore.getScheduleMCTimeFiltered
})

const fetcherMC = () => {
  realTimeStore.fetchRealTimeMC()
  scheduleStore.fetchTime()
  scheduleStore.fetchScheduleMC()
  alert("MC data fetched")
}

onMounted(() => {
  realTimeStore.fetchRealTimeMC()
  scheduleStore.fetchTime()
  scheduleStore.fetchScheduleMC()

  map = leaflet.map("map").setView([mcMarker.value.latitude, mcMarker.value.longitude], 13);

  leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map)

  leaflet.marker([mcMarker.value.latitude, mcMarker.value.longitude]).addTo(map);
})
</script>

<style scoped lang="scss">
main {
  padding-bottom: 5.625rem;
  display: grid;
  gap: 8px;
}

#map {
  height: 300px;
}
</style>
