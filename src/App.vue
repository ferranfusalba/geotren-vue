<script setup lang="ts">
// Vue Router
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
  footer {
    position: fixed;
    bottom: 0;

    nav {
      height: 3.75rem;
      width: 100vw;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      background-color: #97d700;

      a {
        display: flex;
        justify-content: center;
        align-items: center;
        text-decoration: none;
        height: 100%;
        color: #51565c;
      }
    }
  }
}
</style>
