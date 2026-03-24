<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { RequirementFormData, Project, User, Status, Priority } from '@/types'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!route.params.id)

const form = ref<RequirementFormData>({
  title: '',
  description: '',
  status: 'draft',
  priority: 'medium',
  project_id: '',
  assignee_id: '',
  due_date: ''
})

const projects = ref<Project[]>([])
const users = ref<User[]>([])
const statuses = ref<Status[]>([])
const loading = ref(true)
const saving = ref(false)
const errors = ref<Record<string, string>>({})

const priorities: Priority[] = ['low', 'medium', 'high', 'critical']

interface Errors {
  title?: string
  project_id?: string
  assignee_id?: string
  [key: string]: string | undefined
}

const fetchData = async (): Promise<void> => {
  try {
    const [projectsRes, usersRes, statusesRes] = await Promise.all([
      fetch('http://localhost:3001/api/projects'),
      fetch('http://localhost:3001/api/users'),
      fetch('http://localhost:3001/api/statuses')
    ])

    projects.value = await projectsRes.json()
    users.value = await usersRes.json()
    statuses.value = await statusesRes.json()

    if (isEdit.value) {
      const reqRes = await fetch(`http://localhost:3001/api/requirements/${route.params.id}`)
      const req = await reqRes.json()
      form.value = {
        title: req.title || '',
        description: req.description || '',
        status: req.status || 'draft',
        priority: req.priority || 'medium',
        project_id: req.project_id || '',
        assignee_id: req.assignee_id || '',
        due_date: req.due_date || ''
      }
    }
  } catch (err) {
    console.error('Failed to fetch data:', err)
  } finally {
    loading.value = false
  }
}

const validate = (): boolean => {
  errors.value = {} as Errors
  if (!form.value.title.trim()) {
    errors.value.title = t('validation.titleRequired')
  }
  if (!form.value.project_id) {
    errors.value.project_id = t('validation.projectRequired')
  }
  if (!form.value.assignee_id) {
    errors.value.assignee_id = t('validation.assigneeRequired')
  }
  return Object.keys(errors.value).length === 0
}

const saveRequirement = async (): Promise<void> => {
  if (!validate()) return

  saving.value = true
  try {
    const url = isEdit.value
      ? `http://localhost:3001/api/requirements/${route.params.id}`
      : 'http://localhost:3001/api/requirements'

    const method = isEdit.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })

    if (!res.ok) throw new Error('Save failed')

    router.push('/requirements')
  } catch (err) {
    console.error('Failed to save requirement:', err)
    saving.value = false
  }
}

const cancel = (): void => {
  router.back()
}

const getStatusLabel = (status: RequirementStatus): string => {
  const labels: Record<RequirementStatus, string> = {
    draft: t('requirements.draft'),
    in_review: t('requirements.inReview'),
    approved: t('requirements.approved'),
    in_progress: t('requirements.inProgress'),
    completed: t('requirements.completed')
  }
  return labels[status] || status
}

const getPriorityLabel = (priority: Priority): string => {
  return t(`requirements.${priority}`)
}

onMounted(fetchData)
</script>

<template>
  <div class="form-page">
    <header class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="cancel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1>{{ isEdit ? t('requirementForm.editTitle') : t('requirementForm.newTitle') }}</h1>
      </div>
    </header>

    <div class="content" v-if="!loading">
      <div class="form-grid">
        <!-- Left Column -->
        <div class="form-main">
          <div class="card">
            <div class="form-group">
              <label for="title">{{ t('requirementForm.titleLabel') }} <span class="required">*</span></label>
              <input
                id="title"
                v-model="form.title"
                type="text"
                :placeholder="t('requirementForm.titlePlaceholder')"
                :class="{ error: errors.title }"
              />
              <span v-if="errors.title" class="error-message">{{ errors.title }}</span>
            </div>

            <div class="form-group">
              <label for="description">{{ t('requirementForm.descriptionLabel') }}</label>
              <textarea
                id="description"
                v-model="form.description"
                rows="6"
                :placeholder="t('requirementForm.descriptionPlaceholder')"
              ></textarea>
            </div>
          </div>

          <div class="card">
            <h3>{{ t('requirementForm.assignment') }}</h3>

            <div class="form-row">
              <div class="form-group">
                <label for="project">{{ t('requirementForm.projectLabel') }} <span class="required">*</span></label>
                <select
                  id="project"
                  v-model="form.project_id"
                  :class="{ error: errors.project_id }"
                >
                  <option value="">{{ t('requirementForm.selectProject') }}</option>
                  <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <span v-if="errors.project_id" class="error-message">{{ errors.project_id }}</span>
              </div>

              <div class="form-group">
                <label for="assignee">{{ t('requirementForm.assigneeLabel') }} <span class="required">*</span></label>
                <select
                  id="assignee"
                  v-model="form.assignee_id"
                  :class="{ error: errors.assignee_id }"
                >
                  <option value="">{{ t('requirementForm.selectAssignee') }}</option>
                  <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
                </select>
                <span v-if="errors.assignee_id" class="error-message">{{ errors.assignee_id }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="form-sidebar">
          <div class="card">
            <h3>{{ t('requirementForm.properties') }}</h3>

            <div class="form-group">
              <label for="status">{{ t('requirementForm.statusLabel') }}</label>
              <select id="status" v-model="form.status">
                <option v-for="s in statuses" :key="s.id" :value="s.name_en">{{ locale === 'zh-CN' ? s.name : s.name_en }}</option>
              </select>
            </div>

            <div class="form-group">
              <label for="priority">{{ t('requirementForm.priorityLabel') }}</label>
              <select id="priority" v-model="form.priority">
                <option v-for="p in priorities" :key="p" :value="p">{{ getPriorityLabel(p) }}</option>
              </select>
            </div>

            <div class="form-group">
              <label for="due_date">{{ t('requirementForm.dueDateLabel') }}</label>
              <input
                id="due_date"
                v-model="form.due_date"
                type="date"
              />
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-secondary" @click="cancel">{{ t('common.cancel') }}</button>
            <button class="btn-primary" @click="saveRequirement" :disabled="saving">
              {{ saving ? t('common.loading') : (isEdit ? t('common.update') : t('common.create')) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>
  </div>
</template>

<style scoped>
.form-page {
  padding: 24px;
}

.page-header {
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

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 16px;
}

.card h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.required {
  color: #ef4444;
}

input, select, textarea {
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

input:focus, select:focus, textarea:focus {
  border-color: #2563eb;
}

input.error, select.error, textarea.error {
  border-color: #ef4444;
}

.error-message {
  display: block;
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
}

textarea {
  resize: vertical;
  min-height: 120px;
}

input[type="date"] {
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 8px;
}

.btn-secondary {
  flex: 1;
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
  flex: 1;
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

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  color: #64748b;
  padding: 40px;
}
</style>
