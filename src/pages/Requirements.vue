<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()

const requirements = ref([])
const projects = ref([])
const loading = ref(true)

const filters = ref({
  status: '',
  priority: '',
  project_id: '',
  search: ''
})

const statuses = ['draft', 'in_review', 'approved', 'in_progress', 'completed']
const priorities = ['low', 'medium', 'high', 'critical']

const fetchRequirements = async () => {
  try {
    const params = new URLSearchParams()
    if (filters.value.status) params.append('status', filters.value.status)
    if (filters.value.priority) params.append('priority', filters.value.priority)
    if (filters.value.project_id) params.append('project_id', filters.value.project_id)
    if (filters.value.search) params.append('search', filters.value.search)

    const res = await fetch(`http://localhost:3001/api/requirements?${params}`)
    requirements.value = await res.json()
  } catch (err) {
    console.error('Failed to fetch requirements:', err)
  } finally {
    loading.value = false
  }
}

const fetchProjects = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/projects')
    projects.value = await res.json()
  } catch (err) {
    console.error('Failed to fetch projects:', err)
  }
}

const getStatusClass = (status) => {
  const classes = {
    draft: 'status-draft',
    in_review: 'status-review',
    approved: 'status-approved',
    in_progress: 'status-progress',
    completed: 'status-completed'
  }
  return classes[status] || 'status-draft'
}

const getPriorityClass = (priority) => {
  const classes = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
    critical: 'priority-critical'
  }
  return classes[priority] || 'priority-medium'
}

const getStatusLabel = (status) => {
  const labels = {
    draft: t('requirements.draft'),
    in_review: t('requirements.inReview'),
    approved: t('requirements.approved'),
    in_progress: t('requirements.inProgress'),
    completed: t('requirements.completed')
  }
  return labels[status] || status
}

const getPriorityLabel = (priority) => {
  return t(`requirements.${priority}`)
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const viewRequirement = (id) => {
  router.push(`/requirements/${id}`)
}

const createRequirement = () => {
  router.push('/requirements/new')
}

const clearFilters = () => {
  filters.value = { status: '', priority: '', project_id: '', search: '' }
  fetchRequirements()
}

const hasActiveFilters = computed(() => {
  return filters.value.status || filters.value.priority || filters.value.project_id || filters.value.search
})

onMounted(() => {
  fetchRequirements()
  fetchProjects()
})
</script>

<template>
  <div class="requirements-page">
    <header class="page-header">
      <h1>{{ t('requirements.title') }}</h1>
      <button class="btn-primary" @click="createRequirement">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 4v16m8-8H4" />
        </svg>
        {{ t('requirements.newRequirement') }}
      </button>
    </header>

    <div class="filters-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="filters.search"
          type="text"
          :placeholder="t('requirements.searchPlaceholder')"
          @keyup.enter="fetchRequirements"
        />
      </div>

      <select v-model="filters.status" @change="fetchRequirements">
        <option value="">{{ t('requirements.allStatus') }}</option>
        <option v-for="s in statuses" :key="s" :value="s">{{ getStatusLabel(s) }}</option>
      </select>

      <select v-model="filters.priority" @change="fetchRequirements">
        <option value="">{{ t('requirements.allPriority') }}</option>
        <option v-for="p in priorities" :key="p" :value="p">{{ getPriorityLabel(p) }}</option>
      </select>

      <select v-model="filters.project_id" @change="fetchRequirements">
        <option value="">{{ t('requirements.allProjects') }}</option>
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>

      <button v-if="hasActiveFilters" class="btn-clear" @click="clearFilters">{{ t('common.clear') }}</button>
    </div>

    <div class="content" v-if="!loading">
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>{{ t('dashboard.id') }}</th>
              <th>{{ t('dashboard.title') }}</th>
              <th>{{ t('dashboard.status') }}</th>
              <th>{{ t('dashboard.priority') }}</th>
              <th>{{ t('requirements.assignee') }}</th>
              <th>{{ t('dashboard.project') }}</th>
              <th>{{ t('requirements.dueDate') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in requirements" :key="req.id" @click="viewRequirement(req.id)">
              <td class="req-id">REQ-{{ String(req.id).padStart(4, '0') }}</td>
              <td class="req-title">{{ req.title }}</td>
              <td><span class="badge" :class="getStatusClass(req.status)">{{ getStatusLabel(req.status) }}</span></td>
              <td><span class="badge" :class="getPriorityClass(req.priority)">{{ getPriorityLabel(req.priority) }}</span></td>
              <td>
                <div class="assignee" v-if="req.assignee_name">
                  <img :src="req.assignee_avatar" :alt="req.assignee_name" class="avatar" />
                  <span>{{ req.assignee_name }}</span>
                </div>
                <span v-else class="no-assignee">-</span>
              </td>
              <td>
                <div class="project-tag" v-if="req.project_name">
                  <span class="project-dot" :style="{ background: req.project_color }"></span>
                  {{ req.project_name }}
                </div>
                <span v-else>-</span>
              </td>
              <td>{{ formatDate(req.due_date) }}</td>
            </tr>
            <tr v-if="requirements.length === 0">
              <td colspan="7" class="empty-state">{{ t('requirements.noRequirements') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>
  </div>
</template>

<style scoped>
.requirements-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-primary svg {
  width: 18px;
  height: 18px;
}

.filters-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-box {
  flex: 1;
  max-width: 300px;
  position: relative;
}

.search-box svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #64748b;
}

.search-box input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-box input:focus {
  border-color: #2563eb;
}

select {
  padding: 10px 32px 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E") no-repeat right 8px center;
  background-size: 16px;
  appearance: none;
  cursor: pointer;
  outline: none;
}

select:focus {
  border-color: #2563eb;
}

.btn-clear {
  padding: 10px 16px;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
}

.btn-clear:hover {
  background: #e2e8f0;
}

.table-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 14px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

td {
  padding: 14px 16px;
  font-size: 14px;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
}

tr:hover {
  background: #f8fafc;
  cursor: pointer;
}

.req-id {
  font-family: monospace;
  font-weight: 500;
  color: #2563eb;
}

.req-title {
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.status-draft { background: #f1f5f9; color: #64748b; }
.status-review { background: #fef3c7; color: #f59e0b; }
.status-approved { background: #eff6ff; color: #2563eb; }
.status-progress { background: #d1fae5; color: #10b981; }
.status-completed { background: #d1fae5; color: #10b981; }

.priority-low { background: #f1f5f9; color: #64748b; }
.priority-medium { background: #fef3c7; color: #f59e0b; }
.priority-high { background: #ffedd5; color: #f97316; }
.priority-critical { background: #fef2f2; color: #ef4444; }

.assignee {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.no-assignee {
  color: #94a3b8;
}

.project-tag {
  display: flex;
  align-items: center;
  gap: 6px;
}

.project-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.empty-state {
  text-align: center;
  color: #64748b;
  padding: 40px !important;
}

.loading {
  text-align: center;
  color: #64748b;
  padding: 40px;
}
</style>
