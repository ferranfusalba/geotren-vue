<template>
  <main class="table-view-layout">
    <EasyDataTable
      :headers="headers"
      :items="rows"
      :hide-footer="true"
      :rows-per-page="100"
      header-class-name="departures-table"
      table-class-name="main-table departures-table"
      :body-row-class-name="rowClass"
    >
      <template #item-day="item">
        <span :class="`tone-${item.tone}`">{{ item.day }}</span>
      </template>
    </EasyDataTable>
  </main>
</template>

<script setup lang="ts">
// Vue
import { computed } from 'vue'
// Table
import type { Header } from 'vue3-easy-data-table'
// Utils
import { holidaysIn } from '@/data/calendar'
import { e8ScheduleLabel } from '@/utils/e8'

const headers: Header[] = [
  { text: 'Date', value: 'date', width: 84 },
  { text: 'Day', value: 'day', width: 44 },
  { text: 'Holiday', value: 'name' }
]

/** dg, dl, dt... — the way a Catalan calendar abbreviates them. */
const WEEKDAYS = ['dg', 'dl', 'dt', 'dc', 'dj', 'dv', 'ds']

const pad = (value: number) => String(value).padStart(2, '0')

/**
 * This year and next, which is as far as a timetable question ever reaches: the
 * year being lived and the one the Christmas holidays spill into.
 */
const today = new Date()
const years = [today.getFullYear(), today.getFullYear() + 1]

/**
 * The e8 runs its Sunday sheet on a holiday, whatever day of the week it lands
 * on — except a holiday Saturday, which also keeps the night runs marked as
 * going every Saturday of the year. Two days a year, and they are printed in the
 * poster's Saturday colour to say so.
 */
const SATURDAY_SERVICE = 'Dissabte festiu'

interface CalendarRow {
  date: string
  day: string
  name: string
  /** The poster section whose colour this day's service is printed in. */
  tone: 'saturday' | 'holiday'
  past: boolean
}

const rows = computed<CalendarRow[]>(() => {
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  return years.flatMap((year) =>
    holidaysIn(year).map((holiday) => ({
      date: `${pad(holiday.date.getDate())}/${pad(holiday.date.getMonth() + 1)}/${String(
        holiday.date.getFullYear()
      ).slice(2)}`,
      day: WEEKDAYS[holiday.date.getDay()],
      name: holiday.name,
      tone: e8ScheduleLabel(holiday.date) === SATURDAY_SERVICE ? 'saturday' : 'holiday',
      past: holiday.date < midnight
    }))
  )
})

/** Gone by, dimmed the way a departure that has left is. */
const rowClass = (row: CalendarRow) => (row.past ? 'row-departed' : '')
</script>

<style scoped lang="scss">
// The colours the e8 poster prints its own section headings in, and the same
// ones the connection views name the day's service in.
.tone-saturday {
  color: #ee3124;
  font-weight: 700;
}
.tone-holiday {
  color: #f7941d;
  font-weight: 700;
}
</style>
