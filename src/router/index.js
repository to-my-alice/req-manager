import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'
import Requirements from '../pages/Requirements.vue'
import RequirementDetail from '../pages/RequirementDetail.vue'
import RequirementForm from '../pages/RequirementForm.vue'
import Projects from '../pages/Projects.vue'
import Users from '../pages/Users.vue'
import Login from '../pages/Login.vue'

const routes = [
  { path: '/login', name: 'Login', component: Login },
  { path: '/', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/requirements', name: 'Requirements', component: Requirements, meta: { requiresAuth: true } },
  { path: '/requirements/new', name: 'NewRequirement', component: RequirementForm, meta: { requiresAuth: true } },
  { path: '/requirements/:id', name: 'RequirementDetail', component: RequirementDetail, meta: { requiresAuth: true } },
  { path: '/requirements/:id/edit', name: 'EditRequirement', component: RequirementForm, meta: { requiresAuth: true } },
  { path: '/projects', name: 'Projects', component: Projects, meta: { requiresAuth: true } },
  { path: '/users', name: 'Users', component: Users, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'

  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
