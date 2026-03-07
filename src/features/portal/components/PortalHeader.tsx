'use client'

import UserMenu from '@/app/portal/components/UserMenu'
import Breadcrumb from '@/components/Breadcrumb'

export default function PortalHeader() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Portal' }]} />

      <header className="mb-6 md:mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg md:h-12 md:w-12">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-white md:h-6 md:w-6">
                <path d="M10 2L2 7l8 5 8-5-8-5zM2 13l8 5 8-5M2 10l8 5 8-5" />
              </svg>
            </div>
            <span className="text-lg font-bold md:text-xl" style={{ color: 'var(--foreground)' }}>
              和椿機器人Portal
            </span>
          </div>

          <UserMenu />
        </div>
      </header>
    </>
  )
}
