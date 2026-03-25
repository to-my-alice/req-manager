<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Requirement, ProjectProgress, RequirementStatus, Priority, Status, Followup } from '@/types'

const { t, locale } = useI18n()
const router = useRouter()

interface Stats {
  total: number
  inProgress: number
  completed: number
  overdue: number
}

const stats = ref<Stats>({ total: 0, inProgress: 0, completed: 0, overdue: 0 })
const recentRequirements = ref<Requirement[]>([])
const projectProgress = ref<ProjectProgress[]>([])
const statuses = ref<Status[]>([])
const recentFollowups = ref<Followup[]>([])
const loading = ref(true)

const fetchStats = async (): Promise<void> => {
  try {
    const res = await fetch('http://localhost:3001/api/stats')
    const data = await res.json()
    stats.value = {
      total: data.total,
      inProgress: data.inProgress,
      completed: data.completed,
      overdue: data.overdue
    }
    recentRequirements.value = data.recentRequirements.map((r: Requirement) => ({
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

const fetchStatuses = async (): Promise<void> => {
  try {
    const res = await fetch('http://localhost:3001/api/statuses')
    statuses.value = await res.json()
  } catch (err) {
    console.error('Failed to fetch statuses:', err)
  }
}

const fetchRecentFollowups = async (): Promise<void> => {
  try {
    const res = await fetch('http://localhost:3001/api/followups/recent?limit=10')
    recentFollowups.value = await res.json()
  } catch (err) {
    console.error('Failed to fetch recent followups:', err)
  }
}

const getStatusClass = (status: RequirementStatus): string => {
  const statusItem = statuses.value.find(s => s.name_en === status)
  return statusItem ? '' : 'status-draft'
}

const getStatusStyle = (status: RequirementStatus): Record<string, string> => {
  const statusItem = statuses.value.find(s => s.name_en === status)
  if (statusItem) {
    return {
      background: statusItem.color + '20',
      color: statusItem.color
    }
  }
  return {
    background: '#f1f5f9',
    color: '#64748b'
  }
}

const getPriorityClass = (priority: Priority): string => {
  const classes: Record<Priority, string> = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
    critical: 'priority-critical'
  }
  return classes[priority] || 'priority-medium'
}

const getProgressPercent = (project: ProjectProgress): number => {
  if (!project.total) return 0
  return Math.round((project.completed / project.total) * 100)
}

const viewRequirement = (id: string | number): void => {
  router.push(`/requirements/${id}`)
}

const getStatusLabel = (status: RequirementStatus): string => {
  const statusItem = statuses.value.find(s => s.name_en === status)
  if (statusItem) {
    return locale.value === 'zh-CN' ? statusItem.name : statusItem.name_en
  }
  return status
}

const getPriorityLabel = (priority: Priority): string => {
  return t(`requirements.${priority}`)
}

const formatDateShort = (date: string | null | undefined): string => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })
}

const viewFollowup = (requirementId: string | number): void => {
  router.push(`/requirements/${requirementId}`)
}

onMounted(() => {
  fetchStats()
  fetchStatuses()
  fetchRecentFollowups()
})
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
                  <th>{{ t('dashboard.titleLabel') }}</th>
                  <th>{{ t('dashboard.status') }}</th>
                  <th>{{ t('dashboard.priority') }}</th>
                  <th>{{ t('dashboard.project') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="req in recentRequirements" :key="req.id" @click="viewRequirement(req.id)">
                  <td class="req-id">REQ-{{ String(req.id).padStart(4, '0') }}</td>
                  <td class="req-title">{{ req.title }}</td>
                  <td><span class="badge" :style="getStatusStyle(req.status)">{{ getStatusLabel(req.status) }}</span></td>
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

        <!-- Recent Followups -->
        <div class="card recent-followups">
          <h2>{{ t('dashboard.recentFollowups') || 'Recent Follow-ups' }}</h2>
          <div class="followups-list" v-if="recentFollowups.length > 0">
            <div v-for="followup in recentFollowups" :key="followup.id" class="followup-item" @click="viewFollowup(followup.requirement_id)">
              <div class="followup-avatar">
                <img v-if="followup.follower_avatar" :src="followup.follower_avatar" :alt="followup.follower_name" />
                <span v-else class="initials">{{ followup.follower_name?.charAt(0) || '?' }}</span>
              </div>
              <div class="followup-content">
                <div class="followup-header">
                  <span class="followup-name">{{ followup.follower_name }}</span>
                  <span class="followup-date">{{ formatDateShort(followup.follow_date) }}</span>
                </div>
                <div class="followup-req-title">{{ followup.requirement_title }}</div>
                <div class="followup-preview">{{ followup.content }}</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-followups">
            {{ t('dashboard.noFollowups') || 'No follow-ups yet' }}
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

/* Recent Followups */
.followups-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 320px;
  overflow-y: auto;
}

.followup-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.followup-item:hover {
  background: #f1f5f9;
}

.followup-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.followup-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.followup-avatar .initials {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.followup-content {
  flex: 1;
  min-width: 0;
}

.followup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.followup-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.followup-date {
  font-size: 11px;
  color: #64748b;
}

.followup-req-title {
  font-size: 12px;
  color: #2563eb;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.followup-preview {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-followups {
  text-align: center;
  color: #94a3b8;
  padding: 24px;
  font-size: 14px;
}
</style>
