import { supabase } from './supabase'

export type HubRole = 'admin' | 'user' | 'viewer'

export interface HubPermission {
  id?: number
  user_email: string
  role: HubRole
  created_by: string
  created_at?: string
  updated_at?: string
}

/**
 * 取得所有 Hub 權限
 */
export async function getHubPermissions(): Promise<HubPermission[]> {
  const { data, error } = await supabase
    .from('hub_permissions')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('getHubPermissions error:', error)
    return []
  }
  return data || []
}

/**
 * 取得單一用戶的 Hub 權限
 */
export async function getHubPermission(userEmail: string): Promise<HubPermission | null> {
  const { data, error } = await supabase
    .from('hub_permissions')
    .select('*')
    .eq('user_email', userEmail)
    .maybeSingle()
  
  if (error) {
    console.error('getHubPermission error:', error)
    return null
  }
  return data
}

/**
 * 新增 Hub 權限
 */
export async function addHubPermission(
  permission: Pick<HubPermission, 'user_email' | 'role' | 'created_by'>
): Promise<{ success: boolean; permission?: HubPermission; error?: string }> {
  const { data, error } = await supabase
    .from('hub_permissions')
    .insert({
      user_email: permission.user_email,
      role: permission.role,
      created_by: permission.created_by,
    })
    .select()
    .single()
  
  if (error) {
    if (error.code === '23505') {
      return { success: false, error: '此帳號已有權限設定' }
    }
    return { success: false, error: error.message }
  }
  return { success: true, permission: data }
}

/**
 * 更新 Hub 權限
 */
export async function updateHubPermission(
  userEmail: string,
  updates: Partial<Pick<HubPermission, 'role'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('hub_permissions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_email', userEmail)
  
  if (error) {
    console.error('updateHubPermission error:', error)
    return false
  }
  return true
}

/**
 * 移除 Hub 權限
 */
export async function removeHubPermission(userEmail: string): Promise<boolean> {
  const { error } = await supabase
    .from('hub_permissions')
    .delete()
    .eq('user_email', userEmail)
  
  if (error) {
    console.error('removeHubPermission error:', error)
    return false
  }
  return true
}

/**
 * 檢查用戶是否有 Hub 權限
 */
export async function hasHubPermission(userEmail: string): Promise<boolean> {
  const { data } = await supabase
    .from('hub_permissions')
    .select('id')
    .eq('user_email', userEmail)
    .maybeSingle()
  
  return !!data
}

/**
 * 檢查用戶是否為 Hub 管理員
 */
export async function isHubAdmin(userEmail: string): Promise<boolean> {
  const { data } = await supabase
    .from('hub_permissions')
    .select('role')
    .eq('user_email', userEmail)
    .eq('role', 'admin')
    .maybeSingle()
  
  return !!data
}

/**
 * 取得用戶的 Hub 角色
 */
export async function getHubRole(userEmail: string): Promise<HubRole | null> {
  const { data } = await supabase
    .from('hub_permissions')
    .select('role')
    .eq('user_email', userEmail)
    .maybeSingle()
  
  return data?.role as HubRole || null
}
