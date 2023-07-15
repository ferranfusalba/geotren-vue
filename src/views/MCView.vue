<template>
  <main>
    <EasyDataTable
      :headers="scheduleMCHeaders"
      :items="scheduleMCTimeFiltered"
      :sort-by="sortBy"
      :sort-type="sortType"
      :rows-per-page="10"
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

    <div class="table-lines">
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
              {{ { asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] }}
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
    </div>
  </main>
</template>

<script setup lang="ts">
// Vue
import { onMounted, computed, ref, h } from 'vue'
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
  { text: 'Departure', value: 'departure_time', sortable: true },
  { text: 'Route', value: 'route_short_name' },
  { text: 'Left', value: 'left_str' }
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

const getRouteCell = (value: string) => {
  switch (value) {
    case 'S4':
      return h(S4Logo)
    case 'S8':
      return h(S8Logo)
    case 'R5':
      return h(R5Logo)
    case 'R50':
      return h(R50Logo)
    case 'R53':
      return h(R53Logo)
    case 'R6':
      return h(R6Logo)
    case 'R60':
      return h(R60Logo)
    case 'R63':
      return h(R63Logo)
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
