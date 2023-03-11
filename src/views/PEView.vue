<template>
  <main>
    <h2>Origin PE</h2>
    <table>
      <tr>
        <th>Line</th>
        <th>Dest.</th>
        <th>Dir.</th>
        <th>Est.</th>
        <th>UT</th>
      </tr>
      <tr v-for="user in getUsers" :key="user['id']">
        <td>{{ user['fields']['lin'] }}</td>
        <td>{{ user['fields']['desti'] }}</td>
        <td>{{ user['fields']['dir'] }}</td>
        <td>{{ user['fields']['estacionat_a'] }}</td>
        <td>{{ user['fields']['tipus_unitat'] }}</td>
      </tr>
    </table>
    <table>
      <tr>
        <!-- <th>date</th> -->
        <th>departure</th>
        <!-- <th>arrival</th> -->
        <th>route</th>
        <!-- <th>col</th> -->
        <th>trip_headsign</th>
      </tr>
      <tr v-for="item in getSchedule" :key="item['id']">
        <!-- <td>{{ item['fields']['date'] }}</td> -->
        <td>{{ item['fields']['departure_time'] }}</td>
        <!-- <td>{{ item['fields']['arrival_time'] }}</td> -->
        <td>{{ item['fields']['route_short_name'] }}</td>
        <!-- <td>{{ item['fields']['route_color'] }}</td> -->
        <td>{{ item['fields']['trip_headsign'] }}</td>
      </tr>
    </table>
  </main>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useUserStore } from "../stores/users";
import { useScheduleStore } from "../stores/schedule";

const store = useUserStore();
const getUsers = computed(() => {
  return store.getUsers;
});

const scheduleStore = useScheduleStore();
const getSchedule = computed(() => {
  return scheduleStore.getSchedule;
});

onMounted(() => {
  store.fetchUsers();
  scheduleStore.fetchSchedule();
});
</script>