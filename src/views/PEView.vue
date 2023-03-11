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
  </main>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useUserStore } from "../stores/users";

const store = useUserStore();
const getUsers = computed(() => {
  return store.getUsers;
});

onMounted(() => {
  store.fetchUsers();
});
</script>