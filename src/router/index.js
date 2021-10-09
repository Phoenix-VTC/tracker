import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import(/* webpackChunkName: "home" */ '../views/Home.vue'),
  },
  {
    path: '/pending-jobs',
    name: 'Pending Jobs',
    component: () => import(/* webpackChunkName: "pending-jobs" */ '../views/PendingJobs.vue'),
  },
  {
    path: '/events',
    name: 'Events',
    component: () => import(/* webpackChunkName: "events" */ '../views/Events.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import(/* webpackChunkName: "settings" */ '../views/Settings.vue'),
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
