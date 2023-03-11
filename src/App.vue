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
    height: calc(100vh - 3.75rem);
  }

  footer {
    position: fixed;
    bottom: 0;

    nav {
      height: 3.75rem;
      width: 100vw;
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
}</style>
