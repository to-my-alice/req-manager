<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { User, UserFormData, UserRole, CurrentUser } from '@/types'

const { t } = useI18n()

const users = ref<User[]>([])
const loading = ref(true)
const showModal = ref(false)
const editingUser = ref<User | null>(null)
const deletingUser = ref<User | null>(null)

const form = ref<UserFormData>({
  name: '',
  email: '',
  role: 'member',
  avatar: ''
})

const roles: Exclude<UserRole, 'super_admin'>[] = ['admin', 'manager', 'member']
const errors = ref<Record<string, string>>({})

// Check if current user is super admin
const isSuperAdmin = computed(() => {
  const storedUser = localStorage.getItem('currentUser')
  if (storedUser) {
    try {
      const user: CurrentUser = JSON.parse(storedUser)
      return user.role === 'Super Admin'
    } catch (e) {
      return false
    }
  }
  return false
})

// Super admin user (Alice)
const superAdminUser: User = {
  id: 'super-admin',
  name: 'Alice',
  email: 'alice@admin.com',
  role: 'super_admin',
  avatar: 'https://i.pravatar.cc/150?u=alice'
}

// Display users list (includes super admin if logged in as super admin)
const displayUsers = computed(() => {
  if (isSuperAdmin.value) {
    return [superAdminUser, ...users.value]
  }
  return users.value
})

// Check if user is super admin
const isUserSuperAdmin = (user: User): boolean => {
  return user.role === 'super_admin'
}

const fetchUsers = async (): Promise<void> => {
  try {
    const res = await fetch('http://localhost:3001/api/users')
    users.value = await res.json()
  } catch (err) {
    console.error('Failed to fetch users:', err)
  } finally {
    loading.value = false
  }
}

const openCreateModal = (): void => {
  editingUser.value = null
  form.value = { name: '', email: '', role: 'member', avatar: '' }
  errors.value = {}
  showModal.value = true
}

const openEditModal = (user: User): void => {
  editingUser.value = user
  form.value = { name: user.name, email: user.email, role: user.role as Exclude<UserRole, 'super_admin'>, avatar: user.avatar || '' }
  errors.value = {}
  showModal.value = true
}

const closeModal = (): void => {
  showModal.value = false
  editingUser.value = null
}

const validate = (): boolean => {
  errors.value = {}
  if (!form.value.name.trim()) errors.value.name = t('validation.nameRequired')
  if (!form.value.email.trim()) errors.value.email = t('validation.emailRequired')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) errors.value.email = t('validation.emailInvalid')
  return Object.keys(errors.value).length === 0
}

const saveUser = async (): Promise<void> => {
  if (!validate()) return

  try {
    const url = editingUser.value
      ? `http://localhost:3001/api/users/${editingUser.value.id}`
      : 'http://localhost:3001/api/users'

    const method = editingUser.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })

    if (!res.ok) {
      const err = await res.json()
      alert(err.error || 'Failed to save user')
      return
    }

    closeModal()
    fetchUsers()
  } catch (err) {
    console.error('Failed to save user:', err)
  }
}

const confirmDelete = (user: User): void => {
  deletingUser.value = user
}

const cancelDelete = (): void => {
  deletingUser.value = null
}

const deleteUser = async (): Promise<void> => {
  if (!deletingUser.value) return

  try {
    const res = await fetch(`http://localhost:3001/api/users/${deletingUser.value.id}`, {
      method: 'DELETE'
    })

    if (!res.ok) {
      const err = await res.json()
      alert(err.error || t('users.cannotDelete'))
      return
    }

    deletingUser.value = null
    fetchUsers()
  } catch (err) {
    console.error('Failed to delete user:', err)
  }
}

const getRoleClass = (role: UserRole): string => {
  return `role-${role}`
}

const getRoleLabel = (role: UserRole): string => {
  return t(`users.${role}`)
}

const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

onMounted(fetchUsers)
</script>

<template>
  <div class="users-page">
    <header class="page-header">
      <h1>{{ t('users.title') }}</h1>
      <button class="btn-primary" @click="openCreateModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 4v16m8-8H4" />
        </svg>
        {{ t('users.addUser') }}
      </button>
    </header>

    <div class="content" v-if="!loading">
      <div class="users-grid">
        <div v-for="user in displayUsers" :key="user.id" class="user-card">
          <div class="user-avatar">
            <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
            <span v-else class="initials">{{ getInitials(user.name) }}</span>
          </div>
          <div class="user-info">
            <h3>{{ user.name }}</h3>
            <p class="email">{{ user.email }}</p>
            <span class="role-badge" :class="getRoleClass(user.role)">{{ getRoleLabel(user.role) }}</span>
          </div>
          <div class="user-actions">
            <button
              v-if="!isUserSuperAdmin(user)"
              class="btn-icon"
              @click="openEditModal(user)"
              :title="t('common.edit')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              v-if="!isUserSuperAdmin(user)"
              class="btn-icon danger"
              @click="confirmDelete(user)"
              :title="t('common.delete')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <span v-else class="super-admin-badge">Super Admin</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingUser ? t('users.editUser') : t('users.addUser') }}</h2>
          <button class="btn-close" @click="closeModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="name">{{ t('users.name') }} <span class="required">*</span></label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              :placeholder="t('users.namePlaceholder')"
              :class="{ error: errors.name }"
            />
            <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label for="email">{{ t('users.email') }} <span class="required">*</span></label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              :placeholder="t('users.emailPlaceholder')"
              :class="{ error: errors.email }"
            />
            <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
          </div>

          <div class="form-group">
            <label for="role">{{ t('users.role') }}</label>
            <select id="role" v-model="form.role">
              <option v-for="r in roles" :key="r" :value="r">{{ getRoleLabel(r) }}</option>
            </select>
          </div>

          <div class="form-group">
            <label for="avatar">{{ t('users.avatarUrl') }}</label>
            <input
              id="avatar"
              v-model="form.avatar"
              type="text"
              :placeholder="t('users.avatarPlaceholder')"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">{{ t('common.cancel') }}</button>
          <button class="btn-primary" @click="saveUser">
            {{ editingUser ? t('common.update') : t('common.create') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deletingUser" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal confirm-modal">
        <div class="modal-header">
          <h2>{{ t('users.deleteUser') }}</h2>
        </div>
        <div class="modal-body">
          <p>{{ t('users.deleteConfirm') }} <strong>{{ deletingUser.name }}</strong>?</p>
          <p class="warning-text">{{ t('users.deleteWarning') }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="cancelDelete">{{ t('common.cancel') }}</button>
          <button class="btn-danger" @click="deleteUser">{{ t('common.delete') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.users-page {
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

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.user-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: box-shadow 0.2s;
}

.user-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.initials {
  font-size: 18px;
  font-weight: 600;
  color: #64748b;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2px;
}

.email {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  text-transform: capitalize;
}

.role-admin { background: #fef3c7; color: #d97706; }
.role-manager { background: #dbeafe; color: #2563eb; }
.role-member { background: #f1f5f9; color: #64748b; }
.role-super_admin { background: #f3e8ff; color: #7c3aed; }

.super-admin-badge {
  font-size: 11px;
  font-weight: 500;
  color: #7c3aed;
  background: #f3e8ff;
  padding: 4px 8px;
  border-radius: 4px;
}

.user-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.btn-icon svg {
  width: 18px;
  height: 18px;
  color: #64748b;
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

input, select {
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

input:focus, select:focus {
  border-color: #2563eb;
}

input.error, select.error {
  border-color: #ef4444;
}

.error-message {
  display: block;
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
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
