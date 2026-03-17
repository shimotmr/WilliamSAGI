import { supabase } from './supabase'

export type PortalRole = 'admin' | 'user' | 'dealer' | 'viewer'

export interface PortalPermission {
  id?: number
  user_email: string
  role: PortalRole
  created_by: string
  created_at?: string
  updated_at?: string
}

/**
 * 取得所有 Portal 權限
 */
export async function getPortalPermissions(): Promise<PortalPermission[]> {
  const { data, error } = await supabase
    .from('portal_permissions')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('getPortalPermissions error:', error)
    return []
  }
  return data || []
}

/**
 * 取得單一用戶的 Portal 權限
 */
export async function getPortalPermission(userEmail: string): Promise<PortalPermission | null> {
  const { data, error } = await supabase
    .from('portal_permissions')
    .select('*')
    .eq('user_email', userEmail)
    .maybeSingle()
  
  if (error) {
    console.error('getPortalPermission error:', error)
    return null
  }
  return data
}

/**
 * 新增 Portal 權限
 */
export async function addPortalPermission(
  permission: Pick<PortalPermission, 'user_email' | 'role' | 'created_by'>
): Promise<{ success: boolean; permission?: PortalPermission; error?: string }> {
  const { data, error } = await supabase
    .from('portal_permissions')
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
 * 更新 Portal 權限
 */
export async function updatePortalPermission(
  userEmail: string,
  updates: Partial<Pick<PortalPermission, 'role'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('portal_permissions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_email', userEmail)
  
  if (error) {
    console.error('updatePortalPermission error:', error)
    return false
  }
  return true
}

/**
 * 移除 Portal 權限
 */
export async function removePortalPermission(userEmail: string): Promise<boolean> {
  const { error } = await supabase
    .from('portal_permissions')
    .delete()
    .eq('user_email', userEmail)
  
  if (error) {
    console.error('removePortalPermission error:', error)
    return false
  }
  return true
}

/**
 * 檢查用戶是否有 Portal 權限
 */
export async function hasPortalPermission(userEmail: string): Promise<boolean> {
  const { data } = await supabase
    .from('portal_permissions')
    .select('id')
    .eq('user_email', userEmail)
    .maybeSingle()
  
  return !!data
}

/**
 * 檢查用戶是否為 Portal 管理員
 */
export async function isPortalAdmin(userEmail: string): Promise<boolean> {
  const { data } = await supabase
    .from('portal_permissions')
    .select('role')
    .eq('user_email', userEmail)
    .eq('role', 'admin')
    .maybeSingle()
  
  return !!data
}

/**
 * 取得用戶的 Portal 角色
 */
export async function getPortalRole(userEmail: string): Promise<PortalRole | null> {
  const { data } = await supabase
    .from('portal_permissions')
    .select('role')
    .eq('user_email', userEmail)
    .maybeSingle()
  
  return data?.role as PortalRole || null
}
