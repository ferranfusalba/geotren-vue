<template>
  <main class="table-view-layout" :class="{ 'with-schedule-type': scheduleNotice }">
    <p v-if="calendarStale" class="calendar-warning">
      The calendar says today is
      {{ e8DayType(new Date()) === 'weekday' ? 'an ordinary weekday' : 'a holiday' }}, but FGC is
      running its {{ scheduleStore.dayType === 'saturdayHoliday' ? 'holiday' : 'weekday' }}
      service. The bus times below may be wrong — check src/data/calendar.ts.
    </p>

    <picture>
      <embed type="image/png" src="https://geotren.fgc.cat/isic/qc" width="100%" />
    </picture>

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
              {{ showEarlier ? 'Hide' : 'Show' }} {{ hiddenEarlierCount }} earlier trains
            </button>
          </td>
        </tr>
      </template>

      <!-- The three e8 cells form one band, tinted when the bus takes the
           Molins detour, so the longer ride is obvious without its own column. -->
      <template #item-e8Countdown="item">
        <span v-if="item.e8" class="e8-cell" :class="{ molins: item.e8.viaMolins }">
          <CountdownCell
            v-if="!hasBusGone(item)"
            :departure_time="toTimeString(item.e8.departure)"
          ></CountdownCell>
          <template v-else>&mdash;</template>
        </span>
      </template>
      <template #item-e8Departure="item">
        <span v-if="item.e8" class="e8-cell" :class="{ molins: item.e8.viaMolins }">
          {{ toClock(item.e8.departure) }}
        </span>
      </template>
      <template #item-e8Arrival="item">
        <span
          v-if="item.e8"
          class="e8-cell arrival"
          :class="[
            { molins: item.e8.viaMolins },
            item.e8.slack < COMFORTABLE_MINUTES ? 'tight' : 'roomy'
          ]"
        >
          <span class="clock">{{ toClock(item.e8.arrival) }}</span>
          <i>+{{ item.e8.slack }}</i>
        </span>
        <!-- No bus of its own: what you would wait for this train if you were on
             the bus above. The empty clock keeps the figure in line with it. -->
        <span v-else-if="item.waitFromEarlierBus !== undefined" class="arrival waiting">
          <span class="clock"></span>
          <i>+{{ item.waitFromEarlierBus }}</i>
        </span>
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
import { COMFORTABLE_MINUTES, pairE8WithTrains, type ConnectionRow } from '@/utils/connection'
import { calendarDisagreesWithFgc, e8ScheduleNotice, e8TripsFor } from '@/utils/e8'
import { toTimeString } from '@/utils/timetable'
import { renderScheduledDepartureTime } from '@/utils/utils'

const sortBy = 'departure_time'
const sortType: SortType = 'asc'

const headers: Header[] = [
  { text: 'e8 left', value: 'e8Countdown', width: 76 },
  { text: 'e8 FM', value: 'e8Departure' },
  { text: 'e8 QC', value: 'e8Arrival' },
  { text: 'Train', value: 'departure_time', sortable: false },
  { text: 'Line', value: 'route_short_name' },
  { text: 'Left', value: 'left_str', width: 84 }
]

const toClock = (minutes: number) => toTimeString(minutes).slice(0, 5)

/** The bus can be gone while its train is still worth showing. */
const hasBusGone = (row: ConnectionRow) =>
  row.e8 !== undefined && toTimeString(row.e8.departure) < scheduleStore.time

const scheduleStore = useScheduleStore()

// The bus is matched against the whole day of trains, then the table trims it,
// so a connection does not appear or vanish depending on what is on screen.
// Named only when it is not the ordinary school weekday, so the line appearing
// at all is itself the signal that today runs something different.
const scheduleNotice = computed(() => e8ScheduleNotice())

const runningToday = computed(() => e8TripsFor('fromBarcelona'))

const connections = computed(() =>
  pairE8WithTrains(runningToday.value, scheduleStore.getScheduleQC)
)

const calendarStale = computed(() => calendarDisagreesWithFgc(scheduleStore.dayType))

// Counted in buses, not trains: on a bus that has already left, what you need is
// the trains waiting at Quatre Camins, and trains are the more frequent of the two.
const { rows, showEarlier, hiddenEarlierCount, hasDeparted, isRecentlyDeparted, rowClass } =
  useScheduleTable(
    connections,
    computed(() => scheduleStore.time),
    {
      anchor: (row) => row.e8 !== undefined
    }
  )

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

// Says which printed timetable the rows came from, since two ordinary weekdays
// can differ once the school calendar is taken into account. Pinned above the
// nav so it is on screen wherever you are in the day, not only at the very end.
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

// The colours the poster prints its own section headings in.
.tone-weekday {
  color: #8dc73f;
}
.tone-saturday {
  color: #ee3124;
}
.tone-holiday {
  color: #f7941d;
}

// Room for it, on top of the room the layout already leaves for the nav.
main.with-schedule-type {
  padding-bottom: calc(5.625rem + 32px);
}

.calendar-warning {
  margin: 0;
  padding: 8px 12px;
  background-color: #b3541e;
  color: #ffffff;
  font-size: 13px;
}
</style>
