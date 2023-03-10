<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <main>
    <RouterView />
  </main>
  <footer>
    <nav>
      <RouterLink to="/">Map</RouterLink>
      <RouterLink to="/mc">MC</RouterLink>
      <RouterLink to="/pe">PE</RouterLink>
    </nav>
  </footer>
</template>

<style scoped lang="scss">
:root {
  height: 100vh;
  main {
    height: 90vh;
  }
  nav {
    height: 10vh;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    text-align: center;
    align-items: center;
    background-color: yellowgreen;
    a {
      text-decoration: none;
      color: white;
    }
  }
}
</style>
