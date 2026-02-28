export type AssetStatus = 'active' | 'under_maintenance' | 'disposed' | 'lost'
export type AssetCategory = 'furniture' | 'equipment' | 'vehicle' | 'it' | 'building' | 'other'

export interface Asset {
  id: string
  name: string
  asset_code: string
  category: AssetCategory
  status: AssetStatus
  location: string | null
  purchase_date: string | null
  purchase_price: number | null
  description: string | null
}

export interface AssetFormData {
  name: string
  asset_code: string
  category: AssetCategory
  status: AssetStatus
  location?: string
  purchase_date?: string
  purchase_price?: number
  description?: string
}
