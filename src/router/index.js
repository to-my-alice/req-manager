import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../pages/Dashboard.vue'
import Requirements from '../pages/Requirements.vue'
import RequirementDetail from '../pages/RequirementDetail.vue'
import RequirementForm from '../pages/RequirementForm.vue'
import Projects from '../pages/Projects.vue'
import Users from '../pages/Users.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/requirements', name: 'Requirements', component: Requirements },
  { path: '/requirements/new', name: 'NewRequirement', component: RequirementForm },
  { path: '/requirements/:id', name: 'RequirementDetail', component: RequirementDetail },
  { path: '/requirements/:id/edit', name: 'EditRequirement', component: RequirementForm },
  { path: '/projects', name: 'Projects', component: Projects },
  { path: '/users', name: 'Users', component: Users },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
