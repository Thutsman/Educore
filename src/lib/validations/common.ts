import { z } from 'zod'

export const phoneSchema = z
  .string()
  .regex(/^\+?[0-9\s\-()]{7,15}$/, 'Invalid phone number')
  .optional()
  .or(z.literal(''))

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(1, 'Email is required')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')

export const uuidSchema = z.string().uuid('Invalid ID')

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(100).default(20),
})

export const searchSchema = z.object({
  query: z.string().max(100).optional(),
})
