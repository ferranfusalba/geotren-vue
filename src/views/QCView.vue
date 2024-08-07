<template>
  <main class="table-view-layout">
    <picture>
      <embed type="image/png" src="https://geotren.fgc.cat/isic/qc" width="100%" />
    </picture>
    <EasyDataTable
      :headers="scheduleQCHeaders"
      :items="scheduleQCTimeFiltered"
      :sort-by="sortBy"
      :sort-type="sortType"
      :rows-per-page="200"
      header-class-name="departures-table"
      table-class-name="main-table departures-table"
    >
      <template #item-departure_time="item">{{
        renderScheduledDepartureTime(item.departure_time)
      }}</template>
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
import { onMounted, computed, onUnmounted } from 'vue'
// Pinia Store
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
// Utils
import { renderScheduledDepartureTime } from '@/utils/utils'

const sortBy = 'departure_time'
const sortType: SortType = 'asc'

const scheduleQCHeaders: Header[] = [
  { text: 'Departure', value: 'departure_time', sortable: false },
  { text: 'Line', value: 'route_short_name' },
  { text: 'Destination', value: 'trip_headsign' },
  { text: 'Left', value: 'left_str', width: 84 }
]

const scheduleStore = useScheduleStore()
const scheduleQCTimeFiltered = computed(() => {
  return scheduleStore.getScheduleQCTimeFiltered
})

onMounted(() => {
  scheduleStore.fetchTime()
  scheduleStore.fetchScheduleQC()
})

onUnmounted(() => {
  scheduleStore.cleanScheduledStoreQC()
})
</script>

<style scoped lang="scss">
main {
  picture > *:nth-child(1) {
    min-height: 220px;
  }
}
</style>
