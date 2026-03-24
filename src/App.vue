<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { CurrentUser, NavItem, Language } from '@/types'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()

const isLoggedIn = ref(localStorage.getItem('isLoggedIn') === 'true')
const showUserMenu = ref(false)

// Initialize currentUser from localStorage immediately
const storedUser = localStorage.getItem('currentUser')
const currentUser = ref<CurrentUser>(storedUser ? JSON.parse(storedUser) : {
  name: 'Alice Chen',
  role: 'Super Admin',
  avatar: '/icon/Alice.png'
})

// Watch for route changes to update login state
watch(() => route.path, () => {
  isLoggedIn.value = localStorage.getItem('isLoggedIn') === 'true'
  const storedUser = localStorage.getItem('currentUser')
  if (storedUser) {
    try {
      currentUser.value = JSON.parse(storedUser)
    } catch (e) {
      // Use default
    }
  }
}, { immediate: true })

const navItems: NavItem[] = [
  { name: 'nav.dashboard', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'nav.requirements', path: '/requirements', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { name: 'nav.projects', path: '/projects', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { name: 'nav.users', path: '/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { name: 'nav.settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
]

const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '中文' },
]

const isActive = (path: string): boolean => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const changeLanguage = (code: Language): void => {
  locale.value = code
  localStorage.setItem('locale', code)
}

const handleLogout = (): void => {
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('currentUser')
  isLoggedIn.value = false
  showUserMenu.value = false
  router.push('/login')
}
</script>

<template>
  <div class="app-container">
    <!-- Sidebar - only show when logged in -->
    <aside v-if="isLoggedIn" class="sidebar">
      <div class="logo-area">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </div>
        <span class="logo-text">ReqManager</span>
      </div>

      <nav class="nav-menu">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="nav-icon">
            <path :d="item.icon" />
          </svg>
          <span>{{ t(item.name) }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <!-- Language Switcher -->
        <div class="language-switcher">
          <button
            v-for="lang in languages"
            :key="lang.code"
            class="lang-btn"
            :class="{ active: locale === lang.code }"
            @click="changeLanguage(lang.code)"
          >
            {{ lang.label }}
          </button>
        </div>

        <!-- User Profile -->
        <div class="user-profile-wrapper">
          <div class="user-profile" @click="showUserMenu = !showUserMenu">
            <img :src="currentUser.avatar" :alt="currentUser.name" class="user-avatar" />
            <div class="user-info">
              <div class="user-name">{{ currentUser.name }}</div>
              <div class="user-role">{{ currentUser.role }}</div>
            </div>
            <svg class="menu-arrow" :class="{ rotated: showUserMenu }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <!-- User Dropdown Menu -->
          <div v-if="showUserMenu" class="user-dropdown">
            <button class="dropdown-item logout-item" @click="handleLogout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {{ t('login.logout') }}
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: #1e293b;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px;
  height: 80px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: #2563eb;
}

.logo-icon svg {
  width: 100%;
  height: 100%;
}

.logo-text {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.nav-menu {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #334155;
  color: white;
}

.nav-item.active {
  background: #2563eb;
  color: white;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #334155;
}

.language-switcher {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.lang-btn {
  flex: 1;
  padding: 6px 12px;
  background: #334155;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.lang-btn:hover {
  background: #475569;
  color: white;
}

.lang-btn.active {
  background: #2563eb;
  color: white;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.user-profile:hover {
  background: #334155;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.user-info {
  flex: 1;
}

.user-name {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.user-role {
  color: #94a3b8;
  font-size: 12px;
}

.main-content {
  flex: 1;
  background: #f8fafc;
  overflow-y: auto;
}

.user-profile-wrapper {
  position: relative;
}

.menu-arrow {
  width: 16px;
  height: 16px;
  color: #94a3b8;
  transition: transform 0.2s;
}

.menu-arrow.rotated {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: #334155;
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #475569;
}

.dropdown-item svg {
  width: 18px;
  height: 18px;
}

.logout-item:hover {
  background: #dc2626;
}
</style>
