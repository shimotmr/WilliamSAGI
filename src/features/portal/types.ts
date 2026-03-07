export interface PortalUser {
  employeeId: string
  displayName: string
  isAdmin: boolean
  loading: boolean
}

export interface PortalMenuItemLite {
  id: string
  title: string
  desc: string
  href: string
  group: 'sales' | 'tools' | 'system'
  status?: string
  icon: string
}
