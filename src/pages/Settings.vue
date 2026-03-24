<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Status, StatusFormData } from '@/types'

const { t, locale } = useI18n()

const statuses = ref<Status[]>([])
const loading = ref(true)
const showModal = ref(false)
const editingStatus = ref<Status | null>(null)
const deletingStatus = ref<Status | null>(null)

const form = ref<StatusFormData>({
  name: '',
  name_en: '',
  color: '#64748b',
  sort_order: 0
})

const errors = ref<Record<string, string>>({})

const colorOptions = [
  '#64748b', '#ef4444', '#f59e0b', '#22c55e',
  '#2563eb', '#8b5cf6', '#ec4899', '#06b6d4'
]

const fetchStatuses = async (): Promise<void> => {
  try {
    const res = await fetch('http://localhost:3001/api/statuses')
    statuses.value = await res.json()
  } catch (err) {
    console.error('Failed to fetch statuses:', err)
  } finally {
    loading.value = false
  }
}

const getStatusLabel = (status: Status): string => {
  return locale.value === 'zh-CN' ? status.name : status.name_en
}

const openCreateModal = (): void => {
  editingStatus.value = null
  const maxOrder = statuses.value.length > 0
    ? Math.max(...statuses.value.map(s => s.sort_order)) + 1
    : 1
  form.value = { name: '', name_en: '', color: '#64748b', sort_order: maxOrder }
  errors.value = {}
  showModal.value = true
}

const openEditModal = (status: Status): void => {
  editingStatus.value = status
  form.value = {
    name: status.name,
    name_en: status.name_en,
    color: status.color,
    sort_order: status.sort_order
  }
  errors.value = {}
  showModal.value = true
}

const closeModal = (): void => {
  showModal.value = false
  editingStatus.value = null
}

const validate = (): boolean => {
  errors.value = {}
  if (!form.value.name.trim()) errors.value.name = t('validation.nameRequired')
  if (!form.value.name_en.trim()) errors.value.name_en = 'Name (EN) is required'
  return Object.keys(errors.value).length === 0
}

const saveStatus = async (): Promise<void> => {
  if (!validate()) return

  try {
    const url = editingStatus.value
      ? `http://localhost:3001/api/statuses/${editingStatus.value.id}`
      : 'http://localhost:3001/api/statuses'

    const method = editingStatus.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })

    if (!res.ok) {
      const err = await res.json()
      alert(err.error || 'Failed to save status')
      return
    }

    closeModal()
    fetchStatuses()
  } catch (err) {
    console.error('Failed to save status:', err)
  }
}

const confirmDelete = (status: Status): void => {
  deletingStatus.value = status
}

const cancelDelete = (): void => {
  deletingStatus.value = null
}

const deleteStatus = async (): Promise<void> => {
  if (!deletingStatus.value) return

  try {
    const res = await fetch(`http://localhost:3001/api/statuses/${deletingStatus.value.id}`, {
      method: 'DELETE'
    })

    if (!res.ok) {
      const err = await res.json()
      alert(err.error || 'Failed to delete status')
      return
    }

    deletingStatus.value = null
    fetchStatuses()
  } catch (err) {
    console.error('Failed to delete status:', err)
  }
}

onMounted(fetchStatuses)
</script>

<template>
  <div class="settings-page">
    <header class="page-header">
      <h1>{{ t('settings.title') || 'Settings' }}</h1>
    </header>

    <!-- Status Management Section -->
    <div class="section">
      <div class="section-header">
        <h2>{{ t('settings.statusManagement') || 'Status Management' }}</h2>
        <button class="btn-primary" @click="openCreateModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 4v16m8-8H4" />
          </svg>
          {{ t('settings.addStatus') || 'Add Status' }}
        </button>
      </div>

      <div class="content" v-if="!loading">
        <div class="status-list">
          <div v-for="status in statuses" :key="status.id" class="status-card">
            <div class="status-info">
              <span class="status-color" :style="{ background: status.color }"></span>
              <div class="status-names">
                <span class="status-name-zh">{{ status.name }}</span>
                <span class="status-name-en">{{ status.name_en }}</span>
              </div>
            </div>
            <div class="status-actions">
              <button class="btn-icon" @click="openEditModal(status)" :title="t('common.edit')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button class="btn-icon danger" @click="confirmDelete(status)" :title="t('common.delete')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">{{ t('common.loading') }}</div>
    </div>

    <!-- Status Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingStatus ? (t('settings.editStatus') || 'Edit Status') : (t('settings.addStatus') || 'Add Status') }}</h2>
          <button class="btn-close" @click="closeModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>{{ t('settings.statusNameZh') || 'Status Name (CN)' }} <span class="required">*</span></label>
            <input
              v-model="form.name"
              type="text"
              :placeholder="t('settings.statusNameZhPlaceholder') || 'Enter status name in Chinese'"
              :class="{ error: errors.name }"
            />
            <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label>{{ t('settings.statusNameEn') || 'Status Name (EN)' }} <span class="required">*</span></label>
            <input
              v-model="form.name_en"
              type="text"
              :placeholder="t('settings.statusNameEnPlaceholder') || 'Enter status name in English'"
              :class="{ error: errors.name_en }"
            />
            <span v-if="errors.name_en" class="error-message">{{ errors.name_en }}</span>
          </div>

          <div class="form-group">
            <label>{{ t('settings.color') || 'Color' }}</label>
            <div class="color-picker">
              <button
                v-for="color in colorOptions"
                :key="color"
                class="color-option"
                :class="{ selected: form.color === color }"
                :style="{ background: color }"
                @click="form.color = color"
              ></button>
            </div>
          </div>

          <div class="form-group">
            <label>{{ t('settings.sortOrder') || 'Sort Order' }}</label>
            <input
              v-model.number="form.sort_order"
              type="number"
              min="1"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">{{ t('common.cancel') }}</button>
          <button class="btn-primary" @click="saveStatus">{{ t('common.save') }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deletingStatus" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal confirm-modal">
        <div class="modal-header">
          <h2>{{ t('settings.deleteStatus') || 'Delete Status' }}</h2>
        </div>
        <div class="modal-body">
          <p>{{ t('settings.deleteConfirm') || 'Are you sure you want to delete this status?' }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="cancelDelete">{{ t('common.cancel') }}</button>
          <button class="btn-danger" @click="deleteStatus">{{ t('common.delete') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
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

.section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 16px;
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

.status-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-color {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.status-names {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-name-zh {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.status-name-en {
  font-size: 12px;
  color: #64748b;
}

.status-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
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

.btn-icon svg {
  width: 18px;
  height: 18px;
  color: #64748b;
}

.btn-icon:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.btn-icon.danger:hover {
  background: #fef2f2;
  border-color: #fecaca;
}

.btn-icon.danger:hover svg {
  color: #ef4444;
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

.form-group input {
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

.form-group input:focus {
  border-color: #2563eb;
}

.form-group input.error {
  border-color: #ef4444;
}

.error-message {
  display: block;
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
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
