<template>
  <main>
    <EasyDataTable
      :headers="realTimeMCHeaders"
      :items="realTimeMCFields"
      :sort-by="sortByRealtime"
      :sort-type="sortTypeRealtime"
      :hide-footer="true"
      table-class-name="customize-table"
      style="--6c2c1440: 0"
      :rows-per-page="5"
    >
      <template #item-lin="item">
        <R50Logo v-if="item.lin === 'R5R'" />
        <R5Logo v-if="item.lin === 'R5'" />
        <R60Logo v-if="item.lin === 'R6R'" />
        <R63Logo v-if="item.lin === 'R61'" />
        <R63Logo v-if="item.lin === 'R62'" />
        <R6Logo v-if="item.lin === 'R6'" />
        <S4Logo v-if="item.lin === 'S4'" />
        <S8Logo v-if="item.lin === 'S8'" />
      </template>
    </EasyDataTable>

    <EasyDataTable
      :headers="scheduleMCHeaders"
      :items="scheduleMCTimeFiltered"
      :sort-by="sortBySchedule"
      :sort-type="sortTypeSchedule"
      :rows-per-page="200"
      table-class-name="customize-table"
    >
      <template #item-route_short_name="item">
        <R50Logo v-if="item.route_short_name === 'R50'" />
        <R53Logo v-if="item.route_short_name === 'R53'" />
        <R5Logo v-if="item.route_short_name === 'R5'" />
        <R60Logo v-if="item.route_short_name === 'R60'" />
        <R63Logo v-if="item.route_short_name === 'R63'" />
        <R6Logo v-if="item.route_short_name === 'R6'" />
        <S4Logo v-if="item.route_short_name === 'S4'" />
        <S8Logo v-if="item.route_short_name === 'S8'" />
      </template>
      <template #item-left_str="item">
        <CountdownCell :departure_time="item.departure_time"></CountdownCell>
      </template>
    </EasyDataTable>
  </main>
</template>

<script setup lang="ts">
// Vue
import { onMounted, computed } from 'vue'
// Pinia Store
import { useRealTimeStore } from '../stores/realtime'
import { useScheduleStore } from '../stores/schedule'
// Table
import type { Header, SortType } from 'vue3-easy-data-table'
// Components
import CountdownCell from '../components/countdown/CountdownCell.vue'
// Assets
import R5Logo from '../components/lines/R5Logo.vue'
import R6Logo from '../components/lines/R6Logo.vue'
import R50Logo from '../components/lines/R50Logo.vue'
import R53Logo from '../components/lines/R53Logo.vue'
import R60Logo from '../components/lines/R60Logo.vue'
import R63Logo from '../components/lines/R63Logo.vue'
import S4Logo from '../components/lines/S4Logo.vue'
import S8Logo from '../components/lines/S8Logo.vue'

const sortByRealtime = 'distance'
const sortTypeRealtime: SortType = 'asc'
const realTimeMCHeaders: Header[] = [
  { text: 'Unit', value: 'tipus_unitat' },
  { text: 'Line', value: 'lin' },
  { text: 'Ocupation', value: 'ocupacio_m1_percent' },
  { text: 'Location', value: 'estacionat_a' },
  { text: 'Distance', value: 'distance' }
]

const sortBySchedule = 'departure_time'
const sortTypeSchedule: SortType = 'asc'
const scheduleMCHeaders: Header[] = [
  { text: 'Departure', value: 'departure_time', sortable: false },
  { text: 'Route', value: 'route_short_name' },
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

onMounted(() => {
  realTimeStore.fetchRealTimeMC()
  scheduleStore.fetchTime()
  scheduleStore.fetchScheduleMC()
})
</script>

<style scoped lang="scss">
main {
  padding-bottom: 5.625rem;
  display: grid;
  gap: 8px;
}
</style>
