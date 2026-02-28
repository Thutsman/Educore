export type { AppRole } from './database.types'
import type { AppRole } from './database.types'

export interface UserProfile {
  id: string
  full_name: string
  avatar_url: string | null
  phone: string | null
  status: 'active' | 'inactive' | 'suspended'
  role: AppRole
}

export interface ApiError {
  message: string
  code?: string
  details?: string
}

export type SortDirection = 'asc' | 'desc'

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface SelectOption {
  label: string
  value: string
}

export type Status = 'active' | 'inactive'
export type Gender = 'male' | 'female' | 'other'

// Re-export database types
export type { Database, Json } from './database.types'
