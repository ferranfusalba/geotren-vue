<template>
  <main>
    <EasyDataTable
      :headers="scheduleMCHeaders"
      :items="scheduleMCTimeFiltered"
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

const sortBy = 'departure_time'
const sortType: SortType = 'asc'

const scheduleMCHeaders: Header[] = [
  { text: 'Departure', value: 'departure_time', sortable: false },
  { text: 'Route', value: 'route_short_name' },
  { text: 'Left', value: 'left_str', width: 84 }
]

const scheduleStore = useScheduleStore()
const scheduleMCTimeFiltered = computed(() => {
  return scheduleStore.getScheduleMCTimeFiltered
})

onMounted(() => {
  scheduleStore.fetchTime()
  scheduleStore.fetchScheduleMC()
  scheduleStore.fetchRealTime()
})
</script>

<style scoped lang="scss">
main {
  padding-bottom: 5.625rem;
}
</style>
