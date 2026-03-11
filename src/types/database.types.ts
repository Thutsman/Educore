/**
 * Auto-generated types for Supabase schema.
 * Run `npx supabase gen types typescript` to regenerate after schema changes.
 *
 * Until the DB is created, this file provides the structural contract.
 * Replace the contents of this file with Supabase's generated output once live.
 */

export type AppRole =
  | 'headmaster'
  | 'deputy_headmaster'
  | 'school_admin'
  | 'bursar'
  | 'hod'
  | 'class_teacher'
  | 'teacher'
  | 'non_teaching_staff'
  | 'parent'
  | 'student'
  | 'super_admin'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          phone: string | null
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      roles: {
        Row: {
          id: string
          name: AppRole
          description: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['roles']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['roles']['Insert']>
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          assigned_by: string | null
          assigned_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_roles']['Row'], 'id' | 'assigned_at'>
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>
      }
      students: {
        Row: {
          id: string
          admission_no: string
          full_name: string
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | null
          class_id: string | null
          guardian_id: string | null
          profile_id: string | null
          status: 'active' | 'inactive' | 'graduated' | 'transferred'
          photo_url: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['students']['Insert']>
      }
      // Additional tables will be typed after schema migration is applied
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_class_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
