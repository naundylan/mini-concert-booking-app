'use client'

import { ReactNode, useState } from 'react'
import CustomerSidebar from '@/components/customer/sidebar'
import CustomerHeader from '@/components/customer/header'
import RoleGuard from '@/components/auth/role-guard'

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <RoleGuard allowedRole="CUSTOMER">
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <CustomerSidebar mobileOpen={sidebarOpen} onCloseMobile={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <CustomerHeader onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-slate-50">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  )
}
