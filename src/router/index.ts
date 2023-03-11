import { createRouter, createWebHistory } from 'vue-router'
// import HomeView from '../views/MapView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      // component: HomeView
      component: () => import('../views/MapView.vue')
    },
    {
      path: '/mc',
      name: 'mc',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/MCView.vue')
    },
    {
      path: '/pe',
      name: 'pe',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/PEView.vue')
    }
  ]
})

export default router
