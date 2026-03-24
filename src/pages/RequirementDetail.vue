<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Requirement, RequirementStatus, Priority, Followup, FollowupFormData, User, Status } from '@/types'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()

const requirement = ref<Requirement | null>(null)
const statuses = ref<Status[]>([])
const loading = ref(true)
const deleting = ref(false)

// Followups
const followups = ref<Followup[]>([])
const users = ref<User[]>([])
const showFollowupModal = ref(false)
const editingFollowup = ref<Followup | null>(null)
const deletingFollowup = ref<Followup | null>(null)

const followupForm = ref<FollowupFormData>({
  follower_id: '',
  follow_date: '',
  location: '',
  content: '',
  conclusion: '',
  next_follow_date: ''
})

const fetchRequirement = async (): Promise<void> => {
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

const fetchFollowups = async (): Promise<void> => {
  try {
    const res = await fetch(`http://localhost:3001/api/requirements/${route.params.id}/followups`)
    followups.value = await res.json()
  } catch (err) {
    console.error('Failed to fetch followups:', err)
  }
}

const fetchUsers = async (): Promise<void> => {
  try {
    const res = await fetch('http://localhost:3001/api/users')
    users.value = await res.json()
  } catch (err) {
    console.error('Failed to fetch users:', err)
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

const formatDate = (date: string | null | undefined): string => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const formatDateShort = (date: string | null | undefined): string => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const editRequirement = (): void => {
  router.push(`/requirements/${route.params.id}/edit`)
}

const deleteRequirement = async (): Promise<void> => {
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

const goBack = (): void => {
  router.push('/requirements')
}

// Followup methods
const openAddFollowupModal = (): void => {
  editingFollowup.value = null
  const now = new Date().toISOString().split('T')[0]
  followupForm.value = {
    follower_id: '',
    follow_date: now,
    location: '',
    content: '',
    conclusion: '',
    next_follow_date: ''
  }
  showFollowupModal.value = true
}

const openEditFollowupModal = (followup: Followup): void => {
  editingFollowup.value = followup
  followupForm.value = {
    follower_id: String(followup.follower_id),
    follow_date: followup.follow_date,
    location: followup.location || '',
    content: followup.content,
    conclusion: followup.conclusion || '',
    next_follow_date: followup.next_follow_date || ''
  }
  showFollowupModal.value = true
}

const closeFollowupModal = (): void => {
  showFollowupModal.value = false
  editingFollowup.value = null
}

const saveFollowup = async (): Promise<void> => {
  if (!followupForm.value.follower_id || !followupForm.value.follow_date || !followupForm.value.content) {
    alert('Please fill in all required fields')
    return
  }

  try {
    const url = editingFollowup.value
      ? `http://localhost:3001/api/followups/${editingFollowup.value.id}`
      : `http://localhost:3001/api/requirements/${route.params.id}/followups`

    const method = editingFollowup.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(followupForm.value)
    })

    if (!res.ok) {
      const err = await res.json()
      alert(err.error || 'Failed to save followup')
      return
    }

    closeFollowupModal()
    fetchFollowups()
  } catch (err) {
    console.error('Failed to save followup:', err)
  }
}

const confirmDeleteFollowup = (followup: Followup): void => {
  deletingFollowup.value = followup
}

const cancelDeleteFollowup = (): void => {
  deletingFollowup.value = null
}

const deleteFollowup = async (): Promise<void> => {
  if (!deletingFollowup.value) return

  try {
    const res = await fetch(`http://localhost:3001/api/followups/${deletingFollowup.value.id}`, {
      method: 'DELETE'
    })

    if (!res.ok) {
      const err = await res.json()
      alert(err.error || 'Failed to delete followup')
      return
    }

    deletingFollowup.value = null
    fetchFollowups()
  } catch (err) {
    console.error('Failed to delete followup:', err)
  }
}

onMounted(() => {
  fetchRequirement()
  fetchFollowups()
  fetchUsers()
  fetchStatuses()
})
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
              <span class="badge" :style="getStatusStyle(requirement.status)">
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

          <!-- Followups Section -->
          <div class="card followups-card">
            <div class="followups-header">
              <h3>{{ t('requirementDetail.followups') || 'Follow-ups' }}</h3>
              <button class="btn-primary-sm" @click="openAddFollowupModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                {{ t('requirementDetail.addFollowup') || 'Add Follow-up' }}
              </button>
            </div>

            <div v-if="followups.length === 0" class="no-followups">
              {{ t('requirementDetail.noFollowups') || 'No follow-ups yet' }}
            </div>

            <div v-else class="followups-list">
              <div v-for="followup in followups" :key="followup.id" class="followup-item">
                <div class="followup-avatar">
                  <img v-if="followup.follower_avatar" :src="followup.follower_avatar" :alt="followup.follower_name" />
                  <span v-else class="initials">{{ followup.follower_name?.charAt(0) || '?' }}</span>
                </div>
                <div class="followup-content">
                  <div class="followup-header">
                    <span class="followup-name">{{ followup.follower_name }}</span>
                    <span class="followup-date">{{ formatDateShort(followup.follow_date) }}</span>
                  </div>
                  <div v-if="followup.location" class="followup-location">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {{ followup.location }}
                  </div>
                  <div class="followup-body">
                    <p><strong>{{ t('requirementDetail.communicationContent') || 'Content' }}:</strong> {{ followup.content }}</p>
                    <p v-if="followup.conclusion"><strong>{{ t('requirementDetail.communicationConclusion') || 'Conclusion' }}:</strong> {{ followup.conclusion }}</p>
                    <p v-if="followup.next_follow_date" class="next-follow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {{ t('requirementDetail.nextFollowup') || 'Next follow-up' }}: {{ formatDateShort(followup.next_follow_date) }}
                    </p>
                  </div>
                </div>
                <div class="followup-actions">
                  <button class="btn-icon-sm" @click="openEditFollowupModal(followup)" :title="t('common.edit')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button class="btn-icon-sm danger" @click="confirmDeleteFollowup(followup)" :title="t('common.delete')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
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

    <!-- Followup Modal -->
    <div v-if="showFollowupModal" class="modal-overlay" @click.self="closeFollowupModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingFollowup ? (t('requirementDetail.editFollowup') || 'Edit Follow-up') : (t('requirementDetail.addFollowup') || 'Add Follow-up') }}</h2>
          <button class="btn-close" @click="closeFollowupModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>{{ t('requirementDetail.follower') || 'Follower' }} <span class="required">*</span></label>
            <select v-model="followupForm.follower_id">
              <option value="">{{ t('requirementDetail.selectFollower') || 'Select follower' }}</option>
              <option v-for="user in users" :key="user.id" :value="String(user.id)">{{ user.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ t('requirementDetail.followDate') || 'Follow-up Date' }} <span class="required">*</span></label>
            <input type="date" v-model="followupForm.follow_date" />
          </div>

          <div class="form-group">
            <label>{{ t('requirementDetail.location') || 'Location' }}</label>
            <input type="text" v-model="followupForm.location" :placeholder="t('requirementDetail.locationPlaceholder') || 'Enter location'" />
          </div>

          <div class="form-group">
            <label>{{ t('requirementDetail.communicationContent') || 'Communication Content' }} <span class="required">*</span></label>
            <textarea v-model="followupForm.content" rows="4" :placeholder="t('requirementDetail.contentPlaceholder') || 'Enter communication content'"></textarea>
          </div>

          <div class="form-group">
            <label>{{ t('requirementDetail.communicationConclusion') || 'Communication Conclusion' }}</label>
            <textarea v-model="followupForm.conclusion" rows="3" :placeholder="t('requirementDetail.conclusionPlaceholder') || 'Enter conclusion'"></textarea>
          </div>

          <div class="form-group">
            <label>{{ t('requirementDetail.nextFollowup') || 'Next Follow-up Date' }}</label>
            <input type="date" v-model="followupForm.next_follow_date" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeFollowupModal">{{ t('common.cancel') }}</button>
          <button class="btn-primary" @click="saveFollowup">{{ t('common.save') }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Followup Confirmation -->
    <div v-if="deletingFollowup" class="modal-overlay" @click.self="cancelDeleteFollowup">
      <div class="modal confirm-modal">
        <div class="modal-header">
          <h2>{{ t('requirementDetail.deleteFollowup') || 'Delete Follow-up' }}</h2>
        </div>
        <div class="modal-body">
          <p>{{ t('requirementDetail.deleteFollowupConfirm') || 'Are you sure you want to delete this follow-up record?' }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="cancelDeleteFollowup">{{ t('common.cancel') }}</button>
          <button class="btn-danger" @click="deleteFollowup">{{ t('common.delete') }}</button>
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

/* Followups Section */
.followups-card {
  margin-top: 16px;
}

.followups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.followups-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.btn-primary-sm {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary-sm:hover {
  background: #1d4ed8;
}

.btn-primary-sm svg {
  width: 16px;
  height: 16px;
}

.no-followups {
  text-align: center;
  color: #94a3b8;
  padding: 24px;
  font-size: 14px;
}

.followups-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.followup-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.followup-avatar {
  width: 40px;
  height: 40px;
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
  font-size: 14px;
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
  margin-bottom: 4px;
}

.followup-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.followup-date {
  font-size: 12px;
  color: #64748b;
}

.followup-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
}

.followup-location svg {
  width: 14px;
  height: 14px;
}

.followup-body {
  font-size: 13px;
  color: #475569;
}

.followup-body p {
  margin: 0 0 4px 0;
}

.followup-body .next-follow {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #2563eb;
  font-weight: 500;
  margin-top: 8px;
}

.followup-body .next-follow svg {
  width: 14px;
  height: 14px;
}

.followup-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.btn-icon-sm {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon-sm svg {
  width: 14px;
  height: 14px;
  color: #64748b;
}

.btn-icon-sm:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.btn-icon-sm.danger:hover {
  background: #fef2f2;
  border-color: #fecaca;
}

.btn-icon-sm.danger:hover svg {
  color: #ef4444;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.btn-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-close:hover {
  background: #f1f5f9;
}

.btn-close svg {
  width: 20px;
  height: 20px;
  color: #64748b;
}

.modal-body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.required {
  color: #ef4444;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #1e293b;
  background: white;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #2563eb;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
}

.btn-secondary {
  padding: 10px 16px;
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

.btn-primary {
  padding: 10px 16px;
  background: #2563eb;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-danger {
  padding: 10px 16px;
  background: #ef4444;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger:hover {
  background: #dc2626;
}

.confirm-modal .modal-body p {
  font-size: 14px;
  color: #1e293b;
  margin: 0;
}
</style>
