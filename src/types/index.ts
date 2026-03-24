// Requirement Status
export type RequirementStatus = 'draft' | 'in_review' | 'approved' | 'in_progress' | 'completed'

// Priority
export type Priority = 'low' | 'medium' | 'high' | 'critical'

// User Role
export type UserRole = 'admin' | 'manager' | 'member' | 'super_admin'

// Requirement
export interface Requirement {
  id: string | number
  title: string
  description: string
  status: RequirementStatus
  priority: Priority
  project_id: string
  project_name?: string
  project_color?: string
  assignee_id?: string
  assignee_name?: string
  assignee_avatar?: string
  due_date?: string
  tags?: string[]
  created_at?: string
  updated_at?: string
}

// Project
export interface Project {
  id: string | number
  name: string
  description?: string
  color: string
  requirement_count?: number
  completed_count?: number
  created_at?: string
  updated_at?: string
}

// User
export interface User {
  id: string | number
  name: string
  email: string
  role: UserRole
  avatar?: string
  created_at?: string
  updated_at?: string
}

// Requirement Form Data
export interface RequirementFormData {
  title: string
  description: string
  status: RequirementStatus
  priority: Priority
  project_id: string
  assignee_id?: string
  due_date?: string
}

// Project Form Data
export interface ProjectFormData {
  name: string
  description?: string
  color: string
}

// User Form Data
export interface UserFormData {
  name: string
  email: string
  role: Exclude<UserRole, 'super_admin'>
  avatar?: string
}

// Filters
export interface Filters {
  status: string
  priority: string
  project_id: string
  search: string
}

// Stats Response
export interface StatsResponse {
  total: number
  inProgress: number
  completed: number
  overdue: number
  recentRequirements: Requirement[]
  projectProgress: ProjectProgress[]
}

// Project Progress
export interface ProjectProgress {
  id: string | number
  name: string
  color: string
  total: number
  completed: number
}

// Nav Item
export interface NavItem {
  name: string
  path: string
  icon: string
}

// Current User (stored in localStorage)
export interface CurrentUser {
  name: string
  role: 'Super Admin' | UserRole
  avatar: string
}

// Super Admin Credentials
export interface SuperAdminCredentials {
  username: string
  password: string
}

// API Error Response
export interface ApiError {
  error: string
}

// Modal State
export interface ModalState {
  show: boolean
  editing: boolean
}

// Followup
export interface Followup {
  id: string | number
  requirement_id: string | number
  follower_id: string | number
  follower_name?: string
  follower_avatar?: string
  follow_date: string
  location?: string
  content: string
  conclusion?: string
  next_follow_date?: string
  created_at?: string
  updated_at?: string
}

export interface FollowupFormData {
  follower_id: string
  follow_date: string
  location: string
  content: string
  conclusion: string
  next_follow_date: string
}

// Language
export type Language = 'en' | 'zh-CN'

// Status
export interface Status {
  id: string | number
  name: string
  name_en: string
  color: string
  sort_order: number
  created_at?: string
}

export interface StatusFormData {
  name: string
  name_en: string
  color: string
  sort_order: number
}
