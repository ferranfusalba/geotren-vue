<template>
  <main>
    <RouterView />
  </main>
  <footer>
    <nav>
      <div>
        <RouterLink to="/" :class="{ active: route.path === '/' }">Map</RouterLink>
      </div>
      <div>
        <RouterLink to="/mc" :class="{ active: route.path === '/mc' }">MC</RouterLink>
      </div>
      <div>
        <RouterLink to="/qc" :class="{ active: route.path === '/qc' }">QC</RouterLink>
      </div>
      <div>
        <RouterLink to="/pe" :class="{ active: route.path === '/pe' }">PE</RouterLink>
      </div>
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
    background-color: var(--color-corporative-primary);
    align-items: center;

    div {
      display: flex;
      justify-content: center;

      a {
        display: flex;
        justify-content: center;
        align-items: center;
        text-decoration: none;
        height: 100%;
        color: var(--color-corporative-secondary);
        background-color: var(--color-corporative-primary);
        width: 80%;
        -webkit-user-select: none;
        -ms-user-select: none;
        user-select: none;

        &.active {
          background-color: var(--color-corporative-secondary);
          box-shadow: -4px -4px 4px 0px rgba(0, 0, 0, 0.25) inset;
          color: var(--color-white);
          border-radius: 1.5625rem;
          height: max-content;
        }

        &:not(.active) {
          background-color: var(--color-corporative-primary);
        }
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
