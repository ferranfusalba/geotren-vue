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
footer {
  position: fixed;
  bottom: 0;
  display: flex;
  justify-content: center;
  width: 100vw;
  background-color: #97d700;

  nav {
    height: 3.75rem;
    display: grid;
    grid-template-columns: repeat(3, 1fr);

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

@media screen and (min-width: 480px) {
  footer>nav {
    width: 30rem;
  }
}

@media screen and (max-width: 480px) {
  footer>nav {
    width: 100%;
  }
}
</style>
