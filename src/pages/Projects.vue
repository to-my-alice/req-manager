<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Project, ProjectFormData } from '@/types'

const { t } = useI18n()
const router = useRouter()

const projects = ref<Project[]>([])
const loading = ref(true)
const searchQuery = ref('')

const showModal = ref(false)
const editingProject = ref<Project | null>(null)
const deletingProject = ref<Project | null>(null)

const form = ref<ProjectFormData>({
  name: '',
  description: '',
  color: '#2563eb'
})

const errors = ref<Record<string, string>>({})

const colors = [
  { value: '#2563eb', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Yellow' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ef4444', label: 'Red' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f97316', label: 'Orange' },
  { value: '#ec4899', label: 'Pink' },
]

const fetchProjects = async (): Promise<void> => {
  try {
    const params = new URLSearchParams()
    if (searchQuery.value) params.append('search', searchQuery.value)

    const res = await fetch(`http://localhost:3001/api/projects?${params}`)
    projects.value = await res.json()
  } catch (err) {
    console.error('Failed to fetch projects:', err)
  } finally {
    loading.value = false
  }
}

const getProgressPercent = (project: Project): number => {
  if (!project.requirement_count) return 0
  return Math.round((project.completed_count! / project.requirement_count) * 100)
}

const viewProject = (id: string | number): void => {
  router.push(`/requirements?project_id=${id}`)
}

// Modal handlers
const openCreateModal = (): void => {
  editingProject.value = null
  form.value = { name: '', description: '', color: '#2563eb' }
  errors.value = {}
  showModal.value = true
}

const openEditModal = (project: Project): void => {
  editingProject.value = project
  form.value = { name: project.name, description: project.description || '', color: project.color }
  errors.value = {}
  showModal.value = true
}

const closeModal = (): void => {
  showModal.value = false
  editingProject.value = null
}

const validate = (): boolean => {
  errors.value = {}
  if (!form.value.name.trim()) errors.value.name = t('validation.titleRequired')
  return Object.keys(errors.value).length === 0
}

const saveProject = async (): Promise<void> => {
  if (!validate()) return

  try {
    const url = editingProject.value
      ? `http://localhost:3001/api/projects/${editingProject.value.id}`
      : 'http://localhost:3001/api/projects'

    const method = editingProject.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })

    if (!res.ok) {
      const err = await res.json()
      alert(err.error || 'Failed to save project')
      return
    }

    closeModal()
    fetchProjects()
  } catch (err) {
    console.error('Failed to save project:', err)
  }
}

const confirmDelete = (project: Project): void => {
  deletingProject.value = project
}

const cancelDelete = (): void => {
  deletingProject.value = null
}

const deleteProject = async (): Promise<void> => {
  if (!deletingProject.value) return

  try {
    const res = await fetch(`http://localhost:3001/api/projects/${deletingProject.value.id}`, {
      method: 'DELETE'
    })

    if (!res.ok) {
      const err = await res.json()
      alert(err.error || t('projects.cannotDelete'))
      return
    }

    deletingProject.value = null
    fetchProjects()
  } catch (err) {
    console.error('Failed to delete project:', err)
  }
}

const handleSearch = (): void => {
  loading.value = true
  fetchProjects()
}

onMounted(fetchProjects)
</script>

<template>
  <div class="projects-page">
    <header class="page-header">
      <h1>{{ t('projects.title') }}</h1>
      <button class="btn-primary" @click="openCreateModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 4v16m8-8H4" />
        </svg>
        {{ t('projects.addProject') }}
      </button>
    </header>

    <!-- Search Bar -->
    <div class="search-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('projects.searchPlaceholder')"
          @keyup.enter="handleSearch"
        />
      </div>
      <button class="btn-search" @click="handleSearch">{{ t('common.search') }}</button>
    </div>

    <div class="content" v-if="!loading">
      <div class="projects-grid">
        <div
          v-for="project in projects"
          :key="project.id"
          class="project-card"
        >
          <div class="card-header" :style="{ background: project.color }">
            <div class="header-actions">
              <button class="btn-edit" @click.stop="openEditModal(project)" :title="t('common.edit')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button class="btn-delete" @click.stop="confirmDelete(project)" :title="t('common.delete')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <h3>{{ project.name }}</h3>
          </div>
          <div class="card-body">
            <p class="description">{{ project.description || t('projects.noDescription') }}</p>

            <div class="stats">
              <div class="stat">
                <span class="stat-value">{{ project.requirement_count || 0 }}</span>
                <span class="stat-label">{{ t('projects.totalRequirements') }}</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ project.completed_count || 0 }}</span>
                <span class="stat-label">{{ t('projects.completedCount') }}</span>
              </div>
            </div>

            <div class="progress-section">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: getProgressPercent(project) + '%', background: project.color }"
                ></div>
              </div>
              <span class="progress-text">{{ getProgressPercent(project) }}% {{ t('dashboard.complete') }}</span>
            </div>

            <button class="btn-view" @click="viewProject(project.id)">{{ t('projects.viewRequirements') }}</button>
          </div>
        </div>
      </div>

      <div v-if="projects.length === 0" class="empty-state">
        {{ t('common.noData') }}
      </div>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingProject ? t('projects.editProject') : t('projects.addProject') }}</h2>
          <button class="btn-close" @click="closeModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="name">{{ t('projects.nameLabel') }} <span class="required">*</span></label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              :placeholder="t('projects.namePlaceholder')"
              :class="{ error: errors.name }"
            />
            <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label for="description">{{ t('projects.descriptionLabel') }}</label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              :placeholder="t('projects.descriptionPlaceholder')"
            ></textarea>
          </div>

          <div class="form-group">
            <label>{{ t('projects.colorLabel') }}</label>
            <div class="color-picker">
              <button
                v-for="c in colors"
                :key="c.value"
                class="color-option"
                :class="{ selected: form.color === c.value }"
                :style="{ background: c.value }"
                @click="form.color = c.value"
                :title="c.label"
              ></button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">{{ t('common.cancel') }}</button>
          <button class="btn-primary" @click="saveProject">
            {{ editingProject ? t('common.update') : t('common.create') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deletingProject" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal confirm-modal">
        <div class="modal-header">
          <h2>{{ t('projects.deleteProject') }}</h2>
        </div>
        <div class="modal-body">
          <p>{{ t('projects.deleteConfirm') }} <strong>{{ deletingProject.name }}</strong>?</p>
          <p class="warning-text">{{ t('projects.deleteWarning') }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="cancelDelete">{{ t('common.cancel') }}</button>
          <button class="btn-danger" @click="deleteProject">{{ t('common.delete') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.projects-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-box {
  flex: 1;
  max-width: 400px;
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

.btn-search {
  padding: 10px 20px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-search:hover {
  background: #1d4ed8;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.project-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.card-header {
  padding: 16px 20px;
  position: relative;
}

.header-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.project-card:hover .header-actions {
  opacity: 1;
}

.btn-edit, .btn-delete {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-edit:hover, .btn-delete:hover {
  background: rgba(255,255,255,0.3);
}

.btn-edit svg, .btn-delete svg {
  width: 14px;
  height: 14px;
  color: white;
}

.card-header h3 {
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  padding-right: 60px;
}

.card-body {
  padding: 20px;
}

.description {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 16px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

.progress-section {
  margin-bottom: 16px;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: #64748b;
}

.btn-view {
  width: 100%;
  padding: 10px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.empty-state {
  text-align: center;
  color: #64748b;
  padding: 40px;
}

.loading {
  text-align: center;
  color: #64748b;
  padding: 40px;
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
  max-width: 480px;
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
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
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

input, textarea {
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

input:focus, textarea:focus {
  border-color: #2563eb;
}

input.error, textarea.error {
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
  min-height: 80px;
}

.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: #1e293b;
  box-shadow: 0 0 0 2px white, 0 0 0 4px #1e293b;
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
  margin-bottom: 8px;
}

.warning-text {
  color: #64748b !important;
  font-size: 13px !important;
}
</style>
