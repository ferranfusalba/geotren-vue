<template>
  <main>
    <EasyDataTable
      :headers="realTimePEHeaders"
      :items="realTimePEFields"
      :hide-footer="true"
      table-class-name="customize-table"
      style="--6c2c1440: 0"
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
        <R50Logo v-if="item.route_short_name === 'R50'" />
        <R53Logo v-if="item.route_short_name === 'R53'" />
        <R5Logo v-if="item.route_short_name === 'R5'" />
        <R60Logo v-if="item.route_short_name === 'R60'" />
        <R63Logo v-if="item.route_short_name === 'R63'" />
        <R6Logo v-if="item.route_short_name === 'R6'" />
        <S4Logo v-if="item.route_short_name === 'S4'" />
        <S8Logo v-if="item.route_short_name === 'S8'" />
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
// Assets
import R5Logo from '../components/lines/R5Logo.vue'
import R6Logo from '../components/lines/R6Logo.vue'
import R50Logo from '../components/lines/R50Logo.vue'
import R53Logo from '../components/lines/R53Logo.vue'
import R60Logo from '../components/lines/R60Logo.vue'
import R63Logo from '../components/lines/R63Logo.vue'
import S4Logo from '../components/lines/S4Logo.vue'
import S8Logo from '../components/lines/S8Logo.vue'

const sortBy = 'departure_time'
const sortType: SortType = 'asc'
const realTimePEHeaders: Header[] = [
  { text: 'Unit', value: 'tipus_unitat' },
  { text: 'Line', value: 'lin' },
  { text: 'Destination', value: 'desti' }
]
const schedulePEHeaders: Header[] = [
  { text: 'Departure', value: 'departure_time', sortable: true },
  { text: 'Route', value: 'route_short_name' },
  { text: 'Left', value: 'left_str' }
]

const realTimeStore = useRealTimeStore()
const realTimePEFields = computed(() => {
  return realTimeStore.getRealTimePEFields
})

const scheduleStore = useScheduleStore()
const schedulePETimeFiltered = computed(() => {
  return scheduleStore.getSchedulePETimeFiltered
})

onMounted(() => {
  realTimeStore.fetchRealTimePE()
  scheduleStore.fetchTime()
  scheduleStore.fetchRealTime()
  scheduleStore.fetchSchedulePE()
})
</script>

<style scoped lang="scss">
main {
  padding-bottom: 5.625rem;
}
</style>
