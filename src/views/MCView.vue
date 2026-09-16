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

    <DaySelector v-model="day" />

    <EasyDataTable
      :headers="scheduleMCHeaders"
      :items="scheduleMCRows"
      :sort-by="sortBySchedule"
      :sort-type="sortTypeSchedule"
      :rows-per-page="200"
      header-class-name="departures-table"
      table-class-name="main-table departures-table"
      :body-row-class-name="rowClass"
    >
      <template #body-prepend v-if="hiddenEarlierCount">
        <tr class="earlier-row">
          <td :colspan="scheduleMCHeaders.length">
            <button @click="showEarlier = !showEarlier" class="toggle-earlier">
              {{ showEarlier ? 'Hide' : 'Show' }} {{ hiddenEarlierCount }} earlier trains
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
        <ElapsedCell
          v-else-if="isRecentlyDeparted(item)"
          :departure_time="item.departure_time"
        ></ElapsedCell>
        <span v-else>&mdash;</span>
      </template>
    </EasyDataTable>
  </main>
</template>

<script setup lang="ts">
// Vue
import { onMounted, computed, onUnmounted } from 'vue'
// Pinia Store
import { useRealTimeStore } from '../stores/realtime'
import { useScheduleStore } from '../stores/schedule'
// Table
import type { Header, SortType } from 'vue3-easy-data-table'
// Composables
import { useScheduleTable } from '@/composables/useScheduleTable'
// Components
import DaySelector from '../components/DaySelector.vue'
import CountdownCell from '../components/countdown/CountdownCell.vue'
import ElapsedCell from '../components/countdown/ElapsedCell.vue'
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
import { postedRows, tomorrow } from '@/utils/posted'
import { POPULATIONS } from '@/utils/timetable'
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
const SCHEDULE_HEADERS: Header[] = [
  { text: 'Departure', value: 'departure_time', sortable: false },
  { text: 'Line', value: 'route_short_name' },
  { text: 'Left', value: 'left_str', width: 84 }
]

const scheduleStore = useScheduleStore()

const day = computed({
  get: () => scheduleStore.day,
  set: (value) => scheduleStore.setDay(value)
})
const isToday = computed(() => day.value === 'today')

// Nothing is counting down towards a day that has not started, so the column
// would be a row of dashes.
const scheduleMCHeaders = computed(() =>
  isToday.value
    ? SCHEDULE_HEADERS
    : SCHEDULE_HEADERS.filter((header) => header.value !== 'left_str')
)

// Today is the live feed cross-checked against the poster; the feed only answers
// for today, so tomorrow is the poster read through the calendar.
const departures = computed(() =>
  isToday.value ? scheduleStore.getScheduleMC : postedRows(tomorrow(), POPULATIONS.MC)
)

// Nothing has gone yet on a day that has not started, so tomorrow is clocked from
// midnight: the whole day shows, undimmed, with no earlier trains to reveal.
const now = computed(() => (isToday.value ? scheduleStore.time : '00:00:00'))

// The store keeps the whole service day; the table shows what is still catchable
// plus the handful that just went, and the rest is a click away.
const {
  rows: scheduleMCRows,
  showEarlier,
  hiddenEarlierCount,
  hasDeparted,
  isRecentlyDeparted,
  rowClass
} = useScheduleTable(departures, now)

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
