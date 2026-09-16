<template>
  <main class="table-view-layout" :class="{ 'with-schedule-type': scheduleNotice }">
    <p v-if="calendarStale" class="calendar-warning">
      The calendar says today is
      {{ e8DayType(new Date()) === 'weekday' ? 'an ordinary weekday' : 'a holiday' }}, but FGC is
      running its {{ scheduleStore.dayType === 'saturdayHoliday' ? 'holiday' : 'weekday' }}
      service. The bus times below may be wrong — check src/data/calendar.ts.
    </p>

    <EasyDataTable
      :headers="headers"
      :items="rows"
      :sort-by="sortBy"
      :sort-type="sortType"
      :rows-per-page="200"
      header-class-name="departures-table"
      table-class-name="main-table departures-table connection-table"
      :body-row-class-name="rowClass"
    >
      <template #body-prepend v-if="hiddenEarlierCount">
        <tr class="earlier-row">
          <td :colspan="headers.length">
            <button @click="showEarlier = !showEarlier" class="toggle-earlier">
              {{ showEarlier ? 'Hide' : 'Show' }} {{ hiddenEarlierCount }} earlier departures
            </button>
          </td>
        </tr>
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
      <template #item-route_short_name="item">
        <S4Logo v-if="item.route_short_name === 'S4'" />
        <S8Logo v-else-if="item.route_short_name === 'S8'" />
        <R5Logo v-else-if="item.route_short_name === 'R5'" />
        <R50Logo v-else-if="item.route_short_name === 'R50'" />
        <R53Logo v-else-if="item.route_short_name === 'R53'" />
        <R6Logo v-else-if="item.route_short_name === 'R6'" />
        <R60Logo v-else-if="item.route_short_name === 'R60'" />
        <R63Logo v-else-if="item.route_short_name === 'R63'" />
        <span v-else class="line-fallback">{{ item.route_short_name || '?' }}</span>
      </template>
      <template #item-departure_time="item">{{
        renderScheduledDepartureTime(item.departure_time)
      }}</template>

      <!-- Where the train drops you, and how long you then stand about. The three
           bus cells tint together when the run takes the Molins detour. -->
      <template #item-qc="item">
        <span
          class="arrival"
          :class="item.bus && item.bus.slack < COMFORTABLE_MINUTES ? 'tight' : 'roomy'"
        >
          <span class="clock">{{ toClock(item.qc) }}</span>
          <i v-if="item.bus">+{{ item.bus.slack }}</i>
        </span>
      </template>
      <template #item-busDeparture="item">
        <span v-if="item.bus" class="e8-cell" :class="{ molins: item.bus.viaMolins }">
          {{ toClock(item.bus.departure) }}
        </span>
      </template>
      <template #item-busCountdown="item">
        <span v-if="item.bus" class="e8-cell" :class="{ molins: item.bus.viaMolins }">
          <CountdownCell
            v-if="!hasBusGone(item)"
            :departure_time="toTimeString(item.bus.departure)"
          ></CountdownCell>
          <template v-else>&mdash;</template>
        </span>
      </template>
    </EasyDataTable>

    <p v-if="scheduleNotice" class="schedule-type" :class="`tone-${scheduleNotice.tone}`">
      {{ scheduleNotice.label }}
    </p>
  </main>
</template>

<script setup lang="ts">
// Vue
import { computed, onMounted, onUnmounted } from 'vue'
// Pinia Store
import { useScheduleStore } from '../stores/schedule'
// Table
import type { Header, SortType } from 'vue3-easy-data-table'
// Composables
import { useScheduleTable } from '@/composables/useScheduleTable'
// Components
import CountdownCell from '../components/countdown/CountdownCell.vue'
import ElapsedCell from '../components/countdown/ElapsedCell.vue'
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
import { e8DayType } from '@/data/calendar'
import { COMFORTABLE_MINUTES, pairTrainsWithE8, type OnwardRow } from '@/utils/connection'
import { calendarDisagreesWithFgc, e8ScheduleNotice, e8TripsFor } from '@/utils/e8'
import { toMinutes, toTimeString } from '@/utils/timetable'
import { renderScheduledDepartureTime } from '@/utils/utils'

const sortBy = 'departure_time'
const sortType: SortType = 'asc'

// The mirror of the inbound view: train first, then the bus it hands you to.
const headers: Header[] = [
  { text: 'Left', value: 'left_str', width: 66 },
  { text: 'Line', value: 'route_short_name' },
  { text: 'MC', value: 'departure_time', sortable: false },
  { text: 'QC', value: 'qc', width: 62 },
  { text: 'QC', value: 'busDeparture' },
  { text: 'Left', value: 'busCountdown', width: 66 }
]

const toClock = (minutes: number) => toTimeString(minutes).slice(0, 5)

const scheduleStore = useScheduleStore()

const scheduleNotice = computed(() => e8ScheduleNotice())
const calendarStale = computed(() => calendarDisagreesWithFgc(scheduleStore.dayType))

const connections = computed(() =>
  pairTrainsWithE8(scheduleStore.getScheduleMCtoQC, e8TripsFor('toBarcelona'))
)

const hasBusGone = (row: OnwardRow) =>
  row.bus !== undefined && toTimeString(row.bus.departure) < scheduleStore.time

/**
 * Here the train is the leg you have to catch, so a row is spent half an hour
 * after it leaves Martorell — long enough that one you may still be riding keeps
 * its onward bus on screen.
 */
const TRAIN_GRACE_MINUTES = 30

const isPassed = (row: OnwardRow) => toMinutes(row.departure_time) < toMinutes(scheduleStore.time)

const isStale = (row: OnwardRow) =>
  toMinutes(row.departure_time) < toMinutes(scheduleStore.time) - TRAIN_GRACE_MINUTES

const { rows, showEarlier, hiddenEarlierCount, hasDeparted, isRecentlyDeparted, rowClass } =
  useScheduleTable(
    connections,
    computed(() => scheduleStore.time),
    { stale: isStale, passed: isPassed }
  )

onMounted(() => {
  scheduleStore.fetchTime()
  scheduleStore.fetchScheduleMC()
})

onUnmounted(() => {
  scheduleStore.cleanScheduledStoreMC()
})
</script>

<style scoped lang="scss">
.calendar-warning {
  margin: 0;
  padding: 8px 12px;
  background-color: #b3541e;
  color: #ffffff;
  font-size: 13px;
}

.schedule-type {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 5.625rem;
  z-index: 1;
  margin: 0;
  padding: 8px 12px;
  background-color: var(--color-background);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.tone-weekday {
  color: #8dc73f;
}
.tone-saturday {
  color: #ee3124;
}
.tone-holiday {
  color: #f7941d;
}

main.with-schedule-type {
  padding-bottom: calc(5.625rem + 32px);
}
</style>
