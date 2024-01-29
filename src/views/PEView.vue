<template>
  <main>
    <EasyDataTable
      :headers="realTimePEArrivalsHeaders"
      :items="realTimePEArrivalsFieldsCoords"
      :sort-by="sortByRealtimePEArrivals"
      :sort-type="sortTypeRealtimePEArrivals"
      :hide-footer="true"
      table-class-name="customize-table"
      style="--6c2c1440: 0"
      :rows-per-page="4"
    >
      <template #item-lin="item">
        <L8Logo v-if="item.lin === 'L8'" />
        <S3Logo v-if="item.lin === 'S3'" />
        <S4Logo v-if="item.lin === 'S4'" />
        <S8Logo v-if="item.lin === 'S8'" />
        <S9Logo v-if="item.lin === 'S9'" />
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
    <EasyDataTable
      :headers="realTimePEDeparturesHeaders"
      :items="realTimePEDeparturesFields"
      :hide-footer="true"
      table-class-name="customize-table"
      style="--6c2c1440: 0"
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
      <template #item-desti="item">
        {{ stations[item.desti] }}
      </template>
    </EasyDataTable>
    <picture>
      <embed type="image/png" src="https://geotren.fgc.cat/isic/pe" width="100%" />
    </picture>
    <EasyDataTable
      :headers="schedulePEHeaders"
      :items="schedulePETimeFiltered"
      :sort-by="sortBy"
      :sort-type="sortType"
      :rows-per-page="200"
      table-class-name="customize-table"
    >
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
import L8Logo from '../components/lines/L8Logo.vue'
import S3Logo from '../components/lines/S3Logo.vue'
import S4Logo from '../components/lines/S4Logo.vue'
import S8Logo from '../components/lines/S8Logo.vue'
import S9Logo from '../components/lines/S9Logo.vue'
import R50Logo from '../components/lines/R50Logo.vue'
import R53Logo from '../components/lines/R53Logo.vue'
import R5Logo from '../components/lines/R5Logo.vue'
import R60Logo from '../components/lines/R60Logo.vue'
import R63Logo from '../components/lines/R63Logo.vue'
import R6Logo from '../components/lines/R6Logo.vue'
// Utils
import { stations } from '@/utils/stations'

const sortByRealtimePEArrivals = 'distance'
const sortTypeRealtimePEArrivals: SortType = 'asc'
const realTimePEArrivalsHeaders: Header[] = [
  { text: 'Unit', value: 'tipus_unitat' },
  { text: 'Line', value: 'lin' },
  { text: 'Oc.', value: 'ocupacio_m1_percent' },
  { text: 'Location', value: 'estacionat_a' },
  { text: 'Dist.', value: 'distance' }
]

const realTimePEDeparturesHeaders: Header[] = [
  { text: 'Unit', value: 'tipus_unitat' },
  { text: 'Line', value: 'lin' },
  { text: 'Destination', value: 'desti' }
]

const sortBy = 'departure_time'
const sortType: SortType = 'asc'
const schedulePEHeaders: Header[] = [
  { text: 'Departure', value: 'departure_time', sortable: false },
  { text: 'Route', value: 'route_short_name' },
  { text: 'Left', value: 'left_str', width: 84 }
]

const realTimeStore = useRealTimeStore()
const realTimePEDeparturesFields = computed(() => {
  return realTimeStore.getRealTimePEDeparturesFields
})
const realTimePEArrivalsFieldsCoords = computed(() => {
  return realTimeStore.getRealTimePEArrivalsFieldsCoords
})

const scheduleStore = useScheduleStore()
const schedulePETimeFiltered = computed(() => {
  return scheduleStore.getSchedulePETimeFiltered
})

onMounted(() => {
  realTimeStore.fetchRealTimePEDepartures()
  realTimeStore.fetchRealTimePEArrivals()
  scheduleStore.fetchTime()
  scheduleStore.fetchSchedulePE()
})
</script>

<style scoped lang="scss">
main {
  padding-bottom: 5.625rem;
  display: grid;
  gap: 4px;
}
</style>
