<template>
  <main class="table-view-layout" :class="{ 'with-schedule-type': scheduleNotice }">
    <p v-if="isToday && calendarStale" class="calendar-warning">
      The calendar says today is
      {{ e8DayType(new Date()) === 'weekday' ? 'an ordinary weekday' : 'a holiday' }}, but FGC is
      running its {{ scheduleStore.dayType === 'saturdayHoliday' ? 'holiday' : 'weekday' }}
      service. The bus times below may be wrong — check src/data/calendar.ts.
    </p>

    <!-- A live board of what is leaving QC now, so it has nothing to say about
         tomorrow. It stays in place rather than disappearing, so the table does
         not jump when the day is switched. -->
    <button
      class="panel-toggle refresh-real-time"
      :aria-expanded="showPanel"
      :disabled="!isToday"
      @click="showPanel = !showPanel"
    >
      QC exits <span aria-hidden="true">{{ showPanel ? '▴' : '▾' }}</span>
    </button>
    <!-- Only mounted when opened, so the board is not fetched on every visit. -->
    <picture v-if="isToday && showPanel">
      <embed type="image/png" src="https://geotren.fgc.cat/isic/qc" width="100%" />
    </picture>

    <DaySelector v-model="day" />

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
            <!-- "departures" rather than "trains": here a row is a way of making
                 the journey, and the count covers the bus-less ones too. -->
            <button @click="showEarlier = !showEarlier" class="toggle-earlier">
              {{ showEarlier ? 'Hide' : 'Show' }} {{ hiddenEarlierCount }} earlier departures
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
        <span v-else-if="item.earlierBus" class="arrival waiting">
          <span class="clock"></span>
          <i>+{{ item.earlierBus.wait }}</i>
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
      <template #item-mcArrival="item">
        <span v-if="arrivalAtMC(item) !== null">{{ toClock(arrivalAtMC(item)!) }}</span>
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
// Pinia Store
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
import { postedRows, tomorrow } from '@/utils/posted'
import { departureAt, POPULATIONS, toClock, toMinutes, toTimeString } from '@/utils/timetable'
import { renderScheduledDepartureTime } from '@/utils/utils'

const sortBy = 'departure_time'
const sortType: SortType = 'asc'

// Two symmetric halves, bus then train: time left to catch it, where it leaves,
// where it gets you. The repeated names are the point — the first QC is when the
// bus arrives there, the second is when the train leaves.
const ALL_HEADERS: Header[] = [
  { text: 'Left', value: 'e8Countdown', width: 66 },
  { text: 'FM', value: 'e8Departure' },
  { text: 'QC', value: 'e8Arrival', width: 62 },
  { text: 'QC', value: 'departure_time', sortable: false },
  { text: 'Line', value: 'route_short_name' },
  { text: 'Left', value: 'left_str', width: 66 }
]

// Neither countdown means anything on a day that has not started, and the table
// has no room to spare for two columns of dashes.
const COUNTDOWN_COLUMNS = ['e8Countdown', 'left_str']

// The room they leave on a day being planned rather than caught, spent on where
// the train gets you: the far end of the journey, which the countdowns crowd out
// on the day itself. How long the ride takes is not worth a column of its own —
// it is 13 or 14 minutes, every time.
const PLANNING_HEADERS: Header[] = [{ text: 'MC', value: 'mcArrival' }]

/**
 * When this train reaches Martorell Central, off its printed trip.
 *
 * Only the poster knows: the API answers for the station it was asked about, so
 * it can say when a train leaves Quatre Camins and not when it arrives.
 */
const arrivalAtMC = (row: ConnectionRow) => (row.trip ? departureAt(row.trip, 'MC') : null)

/** The bus can be gone while its train is still worth showing. */
const hasBusGone = (row: ConnectionRow) =>
  row.e8 !== undefined && toTimeString(row.e8.departure) < now.value

// The FGC board is a live image and the tallest thing on the page; folded away
// by default so the connections are what you land on.
const showPanel = ref(false)

const scheduleStore = useScheduleStore()

const day = computed({
  get: () => scheduleStore.day,
  set: (value) => scheduleStore.setDay(value)
})
const isToday = computed(() => day.value === 'today')

/** The day both timetables are read for. */
const date = computed(() => (isToday.value ? new Date() : tomorrow()))

const headers = computed(() =>
  isToday.value
    ? ALL_HEADERS
    : [
        ...ALL_HEADERS.filter((header) => !COUNTDOWN_COLUMNS.includes(header.value)),
        ...PLANNING_HEADERS
      ]
)

// Nothing has gone yet on a day that has not started, so it is clocked from
// midnight and shows whole.
const now = computed(() => (isToday.value ? scheduleStore.time : '00:00:00'))

// Which printed bus timetable the rows came from — for whichever day is showing,
// since tomorrow may well run a different one. Named only when it is not the
// ordinary school weekday, so the line appearing at all is itself the signal.
const scheduleNotice = computed(() => e8ScheduleNotice(date.value))

const running = computed(() => e8TripsFor('fromBarcelona', date.value))

// Today the feed is authoritative and the poster only backs it up; tomorrow the
// poster is all there is.
const trains = computed(() =>
  isToday.value ? scheduleStore.getScheduleQC : postedRows(date.value, POPULATIONS.QC_TO_MC)
)

const connections = computed(() => pairE8WithTrains(running.value, trains.value))

// FGC's own day type is read off today's live data, so it has nothing to say
// about tomorrow's calendar.
const calendarStale = computed(() => calendarDisagreesWithFgc(scheduleStore.dayType))

/**
 * A row is spent once its bus has gone, not once its train has. A train you can
 * no longer reach from Francesc Macia is no use here however far off it is, and
 * leaving those at the top pushed the first one you could actually take several
 * rows down the table.
 *
 * The grace is the ride itself: a bus that left within the last half hour may
 * still be carrying you, so its train stays on screen.
 */
const BUS_GRACE_MINUTES = 30

/**
 * When this row stopped being reachable from Francesc Macia.
 *
 * A train with no bus of its own is reached on the previous one, so it lives and
 * dies with it — otherwise the wait rows stay bright between dimmed buses they
 * are measured from.
 */
const lastChance = (row: ConnectionRow) =>
  row.e8?.departure ?? row.earlierBus?.departure ?? toMinutes(row.departure_time)

/** Past catching, so it reads as gone even while its train is still to come. */
const isPassed = (row: ConnectionRow) => lastChance(row) < toMinutes(now.value)

/** Past catching by long enough that the bus cannot still be carrying you. */
const isStale = (row: ConnectionRow) => lastChance(row) < toMinutes(now.value) - BUS_GRACE_MINUTES

const { rows, showEarlier, hiddenEarlierCount, hasDeparted, isRecentlyDeparted, rowClass } =
  useScheduleTable(connections, now, { stale: isStale, passed: isPassed })

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
