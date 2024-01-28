<template>
  <main>
    <picture>
      <embed type="image/png" src="https://geotren.fgc.cat/isic/qc" width="100%" />
    </picture>
    <div>
      <table>
        <thead>
          <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <th v-for="header in headerGroup.headers" :key="header.id" :colSpan="header.colSpan">
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
              <template v-if="cell.column.id === 'left_str'">
                <CountdownCell :departure_time="row.original.departure_time"></CountdownCell>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <div />
      <!-- <button @click="rerender">Rerender</button> -->
    </div>
    <EasyDataTable
      :headers="scheduleQCHeaders"
      :items="scheduleQCTimeFiltered"
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
// TanStack Vue Table
import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
  createColumnHelper,
  SortingState
} from '@tanstack/vue-table'
import { ref } from 'vue'
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
// Types
import type { ScheduleFieldsLeft } from '@/types/schedule'

const sortBy = 'departure_time'
const sortType: SortType = 'asc'

const scheduleQCHeaders: Header[] = [
  { text: 'Departure', value: 'departure_time', sortable: false },
  { text: 'Route', value: 'route_short_name' },
  { text: 'Sign', value: 'trip_headsign' },
  { text: 'Left', value: 'left_str', width: 84 }
]

const scheduleStore = useScheduleStore()
const scheduleQCTimeFiltered = computed(() => {
  return scheduleStore.getScheduleQCTimeFiltered
})

// Testing TanStack Vue Table
const columnHelper = createColumnHelper<ScheduleFieldsLeft>()

const columns = [
  columnHelper.accessor('departure_time', {
    cell: (info) => info.getValue(),
    header: () => 'Departure',
    footer: (props) => props.column.id
  }),
  columnHelper.accessor((row) => row.route_short_name, {
    id: 'route',
    cell: (info) => info.getValue(),
    header: () => 'Route',
    footer: (props) => props.column.id
  }),
  columnHelper.accessor('trip_headsign', {
    header: () => 'Sign',
    footer: (props) => props.column.id
  }),
  {
    id: 'left_str',
    accessor: 'departure_time',
    header: () => 'Left'
  }
]

const data = ref(scheduleQCTimeFiltered)

// const rerender = () => {
//   data.value = scheduleQCTimeFiltered
// }

const sorting = ref<SortingState>([{ id: 'left_str', desc: false }])

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
  getCoreRowModel: getCoreRowModel()
})

// Ends Test

onMounted(() => {
  scheduleStore.fetchTime()
  scheduleStore.fetchScheduleQC()
})
</script>

<style scoped lang="scss">
main {
  padding-bottom: 5.625rem;
}
</style>
