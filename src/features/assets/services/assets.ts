import { supabase } from '@/lib/supabase'
import type { Asset, AssetFormData } from '../types'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const n = (v: unknown) => (v != null ? Number(v) : null)

export async function getAssets(schoolId: string, filters?: { category?: string; status?: string; search?: string }): Promise<Asset[]> {
  let q = supabase
    .from('assets')
    .select('id, name, asset_code, category, status, location, purchase_date, purchase_price, description')
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .order('name')
  if (filters?.category && filters.category !== 'all') q = q.eq('category', filters.category)
  if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status)
  if (filters?.search) q = q.ilike('name', `%${filters.search}%`)
  const { data, error } = await q
  if (error || !data) return []
  type Raw = { id: string; name: string; asset_code: string; category: string; status: string; location: string | null; purchase_date: string | null; purchase_price: unknown; description: string | null }
  return (data as unknown as Raw[]).map(r => ({
    id: r.id, name: r.name, asset_code: r.asset_code,
    category: r.category as Asset['category'],
    status: r.status as Asset['status'],
    location: r.location, purchase_date: r.purchase_date,
    purchase_price: n(r.purchase_price), description: r.description,
  }))
}

export async function createAsset(schoolId: string, d: AssetFormData): Promise<boolean> {
  const { error } = await db.from('assets').insert({
    school_id: schoolId,
    name: d.name, asset_code: d.asset_code, category: d.category, status: d.status,
    location: d.location || null, purchase_date: d.purchase_date || null,
    purchase_price: d.purchase_price ?? null, description: d.description || null,
  })
  return !error
}

export async function updateAsset(id: string, d: Partial<AssetFormData>): Promise<boolean> {
  const { error } = await db.from('assets').update(d).eq('id', id)
  return !error
}

export async function deleteAsset(id: string): Promise<boolean> {
  const { error } = await db.from('assets').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  return !error
}
