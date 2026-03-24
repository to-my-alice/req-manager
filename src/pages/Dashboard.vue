<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()

const stats = ref({ total: 0, inProgress: 0, completed: 0, overdue: 0 })
const recentRequirements = ref([])
const projectProgress = ref([])
const loading = ref(true)

const fetchStats = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/stats')
    const data = await res.json()
    stats.value = { total: data.total, inProgress: data.inProgress, completed: data.completed, overdue: data.overdue }
    recentRequirements.value = data.recentRequirements.map(r => ({
      ...r,
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags
    }))
    projectProgress.value = data.projectProgress
  } catch (err) {
    console.error('Failed to fetch stats:', err)
  } finally {
    loading.value = false
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

const getProgressPercent = (project) => {
  if (!project.total) return 0
  return Math.round((project.completed / project.total) * 100)
}

const viewRequirement = (id) => {
  router.push(`/requirements/${id}`)
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

onMounted(fetchStats)
</script>

<template>
  <div class="dashboard">
    <header class="page-header">
      <h1>{{ t('dashboard.title') }}</h1>
    </header>

    <div class="content" v-if="!loading">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">{{ t('dashboard.totalRequirements') }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon in-progress">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.inProgress }}</div>
            <div class="stat-label">{{ t('dashboard.inProgress') }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon completed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.completed }}</div>
            <div class="stat-label">{{ t('dashboard.completed') }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon overdue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.overdue }}</div>
            <div class="stat-label">{{ t('dashboard.overdue') }}</div>
          </div>
        </div>
      </div>

      <!-- Recent Requirements & Project Progress -->
      <div class="dashboard-grid">
        <!-- Recent Requirements -->
        <div class="card recent-req">
          <h2>{{ t('dashboard.recentRequirements') }}</h2>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>{{ t('dashboard.id') }}</th>
                  <th>{{ t('dashboard.title') }}</th>
                  <th>{{ t('dashboard.status') }}</th>
                  <th>{{ t('dashboard.priority') }}</th>
                  <th>{{ t('dashboard.project') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="req in recentRequirements" :key="req.id" @click="viewRequirement(req.id)">
                  <td class="req-id">REQ-{{ String(req.id).padStart(4, '0') }}</td>
                  <td class="req-title">{{ req.title }}</td>
                  <td><span class="badge" :class="getStatusClass(req.status)">{{ getStatusLabel(req.status) }}</span></td>
                  <td><span class="badge" :class="getPriorityClass(req.priority)">{{ getPriorityLabel(req.priority) }}</span></td>
                  <td>{{ req.project_name || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Project Progress -->
        <div class="card project-progress">
          <h2>{{ t('dashboard.projectProgress') }}</h2>
          <div class="projects-list">
            <div v-for="project in projectProgress" :key="project.id" class="project-item">
              <div class="project-header">
                <div class="project-color" :style="{ background: project.color }"></div>
                <span class="project-name">{{ project.name }}</span>
                <span class="project-count">{{ project.completed }}/{{ project.total }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: getProgressPercent(project) + '%', background: project.color }"></div>
              </div>
              <div class="progress-percent">{{ getProgressPercent(project) }}% {{ t('dashboard.complete') }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-icon.total { background: #eff6ff; color: #2563eb; }
.stat-icon.in-progress { background: #f0fdf4; color: #10b981; }
.stat-icon.completed { background: #f0fdf4; color: #10b981; }
.stat-icon.overdue { background: #fef2f2; color: #ef4444; }

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.card h2 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0;
}

td {
  padding: 12px;
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
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
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

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-item {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.project-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.project-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.project-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.project-count {
  font-size: 12px;
  color: #64748b;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-percent {
  font-size: 12px;
  color: #64748b;
}
</style>
