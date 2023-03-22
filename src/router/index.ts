import { createRouter, createWebHistory } from 'vue-router'
import MapView from '../views/MapView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: MapView
    },
    {
      path: '/mc',
      name: 'mc',
      component: () => import('../views/MCView.vue')
    },
    {
      path: '/pe',
      name: 'pe',
      component: () => import('../views/PEView.vue')
    }
  ]
})

export default router
