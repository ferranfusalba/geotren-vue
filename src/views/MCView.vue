<template>
  <main class="table-view-layout">
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

    <button @click="fetcherRealtimeMC()" class="refresh-real-time">Refresh real-time MC</button>

    <EasyDataTable
      :headers="scheduleMCHeaders"
      :items="scheduleMCRows"
      :sort-by="sortBySchedule"
      :sort-type="sortTypeSchedule"
      :rows-per-page="200"
      header-class-name="departures-table"
      table-class-name="main-table departures-table"
      :body-row-class-name="scheduleRowClass"
    >
      <template #body-prepend v-if="departedCount">
        <tr class="earlier-row">
          <td :colspan="scheduleMCHeaders.length">
            <button @click="showEarlier = !showEarlier" class="toggle-earlier">
              {{ showEarlier ? 'Hide' : 'Show' }} {{ departedCount }} earlier trains
            </button>
          </td>
        </tr>
      </template>
      <template #item-departure_time="item">{{
        renderScheduledDepartureTime(item.departure_time)
      }}</template>
      <template #item-route_short_name="item">
        <S4Logo v-if="item.route_short_name === 'S4'" />
        <S8Logo v-else-if="item.route_short_name === 'S8'" />
        <R5Logo v-else-if="item.route_short_name === 'R5'" />
        <R50Logo v-else-if="item.route_short_name === 'R50'" />
        <R53Logo v-else-if="item.route_short_name === 'R53'" />
        <R6Logo v-else-if="item.route_short_name === 'R6'" />
        <R60Logo v-else-if="item.route_short_name === 'R60'" />
        <R63Logo v-else-if="item.route_short_name === 'R63'" />
        <!-- A line we have no roundel for still shows its code, so an unexpected
             value from the API reads as data rather than as an empty cell. -->
        <span v-else class="line-fallback">{{ item.route_short_name || '?' }}</span>
      </template>
      <template #item-left_str="item">
        <CountdownCell
          v-if="!hasDeparted(item)"
          :departure_time="item.departure_time"
        ></CountdownCell>
        <span v-else>&mdash;</span>
      </template>
    </EasyDataTable>
  </main>
</template>

<script setup lang="ts">
// Vue
import { onMounted, computed, onUnmounted, ref } from 'vue'
// Pinia Store
import { useRealTimeStore } from '../stores/realtime'
import { useScheduleStore } from '../stores/schedule'
// Table
import type { Header, SortType } from 'vue3-easy-data-table'
// Types
import type { MergedScheduleRow } from '@/types/schedule'
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

const scheduleStore = useScheduleStore()

// The store keeps the whole service day; by default the table starts at the next
// train, with the ones already gone a button away.
const showEarlier = ref(false)

const hasDeparted = (item: MergedScheduleRow) => item.departure_time < scheduleStore.time

const scheduleMC = computed(() => scheduleStore.getScheduleMC)
const departedCount = computed(() => scheduleMC.value.filter(hasDeparted).length)
const scheduleMCRows = computed(() =>
  showEarlier.value ? scheduleMC.value : scheduleMC.value.filter((item) => !hasDeparted(item))
)

// 'row-missing': the API never reported it and it came off the printed timetable,
// painted so a gap in the open data is visible rather than silent.
// 'row-departed': already gone, dimmed so it cannot be mistaken for a train to catch.
const scheduleRowClass = (item: MergedScheduleRow) =>
  [item.source === 'timetable' ? 'row-missing' : '', hasDeparted(item) ? 'row-departed' : '']
    .filter(Boolean)
    .join(' ')

const realTimeStore = useRealTimeStore()
const realTimeMCFields = computed(() => {
  return realTimeStore.getRealTimeMCFieldsPPCoords
})

const fetcherRealtimeMC = () => {
  realTimeStore.cleanRealtimeStoreMC()
  realTimeStore.fetchRealTimeMC()
}

onMounted(() => {
  realTimeStore.fetchRealTimeMC()
  scheduleStore.fetchTime()
  scheduleStore.fetchScheduleMC()
})

onUnmounted(() => {
  realTimeStore.cleanRealtimeStoreMC()
  scheduleStore.cleanScheduledStoreMC()
})
</script>
