<template>
  <main>
    <RouterView />
  </main>
  <footer>
    <nav>
      <RouterLink to="/" :class="{ active: route.path === '/' }">Map</RouterLink>
      <RouterLink to="/mc" :class="{ active: route.path === '/mc' }">MC</RouterLink>
      <RouterLink to="/qc" :class="{ active: route.path === '/qc' }">QC</RouterLink>
      <RouterLink to="/pe" :class="{ active: route.path === '/pe' }">PE</RouterLink>
    </nav>
  </footer>
</template>

<script setup lang="ts">
// Vue Router
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped lang="scss">
footer {
  position: fixed;
  bottom: 0;
  display: flex;
  justify-content: center;
  width: 100vw;

  nav {
    height: 5.625rem;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    padding-bottom: 1.125rem;
    background-color: #97d700;
    align-items: center;

    a {
      display: flex;
      justify-content: center;
      align-items: center;
      text-decoration: none;
      height: 100%;
      color: #51565c;
      background-color: #97d700;
      &.active {
        background-color: #51565c;
        color: white;
        border-radius: 1.5625rem;
        height: max-content;
      }
      &:not(.active) {
        background-color: #97d700;
      }
    }
  }
}

@media screen and (min-width: 480px) {
  footer > nav {
    width: 30rem;
  }
}

@media screen and (max-width: 480px) {
  footer > nav {
    width: 100%;
  }
}
</style>
