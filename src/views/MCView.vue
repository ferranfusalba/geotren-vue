<template>
  <main>
    <h2>Origin MC</h2>
    <p>{{ currentDate }}</p>
    <EasyDataTable
      :headers="scheduleMCHeaders"
      :items="scheduleMCTimeFiltered"
      :sort-by="sortBy"
      :sort-type="sortType"
      :rows-per-page="10"
      table-class-name="customize-table"
    />

    <div class="p-2">
      <table>
        <thead>
          <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              :colSpan="header.colSpan"
              :class="header.column.getCanSort() ? 'cursor-pointer select-none' : ''"
              @click="header.column.getToggleSortingHandler()?.($event)"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in table.getRowModel().rows" :key="row.id">
            <td v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr v-for="footerGroup in table.getFooterGroups()" :key="footerGroup.id">
            <th v-for="header in footerGroup.headers" :key="header.id" :colSpan="header.colSpan">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.footer"
                :props="header.getContext()"
              />
            </th>
          </tr>
        </tfoot>
      </table>
      <div class="h-4" />
    </div>
  </main>
</template>

<script setup lang="ts">
// Vue
import { onMounted, computed, ref } from 'vue'
// Pinia Store
import { useScheduleStore } from '../stores/schedule'
// Table
import type { Header, SortType } from 'vue3-easy-data-table'
// Tanstack Table
import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
  createColumnHelper,
  type SortingState,
  getSortedRowModel
} from '@tanstack/vue-table'

const sortBy = 'departure_time'
const sortType: SortType = 'asc'

const scheduleMCHeaders: Header[] = [
  { text: 'Departure', value: 'departure_time', sortable: true },
  { text: 'Route', value: 'route_short_name' },
  { text: 'Left', value: 'left_str' }
]

const scheduleStore = useScheduleStore()
const scheduleMCTimeFiltered = computed(() => {
  return scheduleStore.getScheduleMCTimeFiltered
})
const currentDate = computed(() => {
  return scheduleStore.getCurrentDate
})

onMounted(() => {
  scheduleStore.fetchTime()
  scheduleStore.fetchScheduleMC()
  scheduleStore.fetchRealTime()
})

// Tanstack Table

type Train = {
  arrival_time: string
  date: string
  departure_time: string
  exception_time: number
  left_str: string
  route_color: string
  route_long_name: string
  route_short_name: string
  route_text_color: string
  route_type: number
  route_url: string
  shape_id: number
  stop_id: string
  stop_lat: number
  stop_lon: number
  stop_name: string
  stop_sequence: number
  timepoint: number
  trip_headsign: string
  wheelchair_boarding: number
}

const columnHelper = createColumnHelper<Train>()

// TODO: Finish all line cases
const getRouteCell = (value: string) => {
  console.log('value', value)
  switch (value) {
    case 'R53':
      return 'R5!'
    case 'R63':
      return 'R6!'
    default:
      return value
  }
}

const columns = [
  columnHelper.accessor('departure_time', {
    header: () => 'Departure'
  }),
  columnHelper.accessor('route_short_name', {
    header: 'Route',
    cell: (info) => {
      const cellValue = info.getValue()
      return getRouteCell(cellValue)
    }
  }),
  columnHelper.accessor('left_str', {
    header: 'Left',
    enableSorting: false
  })
]

// TODO: Replace any type
const data: any = ref(scheduleMCTimeFiltered)

const sorting = ref<SortingState>([])

// TODO: Add default sorting (id departure_time, desc false)
const table = useVueTable({
  get data() {
    return data.value
  },
  columns,
  state: {
    get sorting() {
      return sorting.value
    }
  },
  onSortingChange: (updaterOrValue) => {
    sorting.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(sorting.value) : updaterOrValue
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel()
})
</script>

<style scoped lang="scss">
main {
  padding-bottom: 3.75rem;
}
</style>
