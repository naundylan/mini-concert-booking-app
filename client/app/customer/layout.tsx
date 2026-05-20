'use client'

import { ReactNode } from 'react'
import CustomerSidebar from '@/components/customer/sidebar'
import RoleGuard from '@/components/auth/role-guard'

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRole="CUSTOMER">
      <div className="flex h-screen bg-slate-50">
        <CustomerSidebar />

        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </RoleGuard>
  )
}
