<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const requirement = ref(null)
const loading = ref(true)
const deleting = ref(false)

const fetchRequirement = async () => {
  try {
    const res = await fetch(`http://localhost:3001/api/requirements/${route.params.id}`)
    if (!res.ok) throw new Error('Not found')
    requirement.value = await res.json()
  } catch (err) {
    console.error('Failed to fetch requirement:', err)
    router.push('/requirements')
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
  return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const editRequirement = () => {
  router.push(`/requirements/${route.params.id}/edit`)
}

const deleteRequirement = async () => {
  if (!confirm(t('requirementDetail.deleteConfirm'))) return

  deleting.value = true
  try {
    await fetch(`http://localhost:3001/api/requirements/${route.params.id}`, { method: 'DELETE' })
    router.push('/requirements')
  } catch (err) {
    console.error('Failed to delete requirement:', err)
    deleting.value = false
  }
}

const goBack = () => {
  router.push('/requirements')
}

onMounted(fetchRequirement)
</script>

<template>
  <div class="detail-page">
    <header class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="req-id">REQ-{{ String(route.params.id).padStart(4, '0') }}</span>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="editRequirement">{{ t('requirementDetail.edit') }}</button>
        <button class="btn-danger" @click="deleteRequirement" :disabled="deleting">{{ t('requirementDetail.delete') }}</button>
      </div>
    </header>

    <div class="content" v-if="!loading && requirement">
      <div class="detail-grid">
        <!-- Left Column - Main Info -->
        <div class="main-info">
          <div class="card">
            <div class="title-section">
              <h1>{{ requirement.title }}</h1>
              <span class="badge" :class="getStatusClass(requirement.status)">
                {{ getStatusLabel(requirement.status) }}
              </span>
            </div>

            <div class="description">
              <h3>{{ t('requirementDetail.description') }}</h3>
              <p>{{ requirement.description || t('requirementDetail.noDescription') }}</p>
            </div>

            <div class="tags" v-if="requirement.tags && requirement.tags.length">
              <h3>{{ t('requirementDetail.tags') }}</h3>
              <div class="tag-list">
                <span v-for="tag in requirement.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Metadata -->
        <div class="metadata">
          <div class="card">
            <h3>{{ t('requirementDetail.details') }}</h3>

            <div class="meta-item">
              <span class="meta-label">{{ t('dashboard.priority') }}</span>
              <span class="badge" :class="getPriorityClass(requirement.priority)">{{ getPriorityLabel(requirement.priority) }}</span>
            </div>

            <div class="meta-item">
              <span class="meta-label">{{ t('requirementDetail.assignee') }}</span>
              <div class="assignee" v-if="requirement.assignee_name">
                <img :src="requirement.assignee_avatar" :alt="requirement.assignee_name" class="avatar" />
                <span>{{ requirement.assignee_name }}</span>
              </div>
              <span v-else class="no-value">{{ t('requirementDetail.unassigned') }}</span>
            </div>

            <div class="meta-item">
              <span class="meta-label">{{ t('requirementDetail.project') }}</span>
              <div class="project" v-if="requirement.project_name">
                <span class="project-dot" :style="{ background: requirement.project_color }"></span>
                {{ requirement.project_name }}
              </div>
              <span v-else class="no-value">-</span>
            </div>

            <div class="meta-item">
              <span class="meta-label">{{ t('requirements.dueDate') }}</span>
              <span class="meta-value">{{ formatDate(requirement.due_date) }}</span>
            </div>

            <div class="meta-item">
              <span class="meta-label">{{ t('requirementDetail.created') }}</span>
              <span class="meta-value">{{ formatDate(requirement.created_at) }}</span>
            </div>

            <div class="meta-item">
              <span class="meta-label">{{ t('requirementDetail.updated') }}</span>
              <span class="meta-value">{{ formatDate(requirement.updated_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>
  </div>
</template>

<style scoped>
.detail-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-back {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-back svg {
  width: 18px;
  height: 18px;
  color: #64748b;
}

.req-id {
  font-family: monospace;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-secondary {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-danger {
  padding: 8px 16px;
  background: white;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.title-section {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.title-section h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
}

.description {
  margin-bottom: 24px;
}

.description h3, .tags h3 {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.description p {
  font-size: 14px;
  color: #1e293b;
  line-height: 1.6;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 4px 12px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.metadata .card h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.meta-item:last-child {
  border-bottom: none;
}

.meta-label {
  font-size: 14px;
  color: #64748b;
}

.meta-value {
  font-size: 14px;
  color: #1e293b;
}

.no-value {
  font-size: 14px;
  color: #94a3b8;
}

.assignee, .project {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.project-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  flex-shrink: 0;
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

.loading {
  text-align: center;
  color: #64748b;
  padding: 40px;
}
</style>
