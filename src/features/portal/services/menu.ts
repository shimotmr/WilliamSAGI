import {
  PORTAL_MENU_ITEMS,
  PORTAL_GROUP_LABELS,
  PORTAL_STATUS_BADGE,
  icons,
} from '@/lib/menu-config'

export const PORTAL_GROUPS = ['sales', 'tools', 'system'] as const

export function getVisiblePortalMenuItems(isAdmin: boolean) {
  return PORTAL_MENU_ITEMS.filter((item) => {
    if (item.group === 'system' && !isAdmin) return false
    return true
  })
}

export { PORTAL_GROUP_LABELS, PORTAL_STATUS_BADGE, icons }
