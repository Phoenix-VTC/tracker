import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import(/* webpackChunkName: "about" */ '../views/Home.vue'),
  },
  {
    path: '/pending-jobs',
    name: 'Pending Jobs',
    component: () => import(/* webpackChunkName: "about" */ '../views/PendingJobs.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import(/* webpackChunkName: "about" */ '../views/Settings.vue'),
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
