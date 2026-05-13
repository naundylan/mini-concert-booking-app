'use client'

import { ReactNode } from 'react'
import CustomerSidebar from '@/components/customer/sidebar'

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <html className="bg-slate-50">
      <body className="bg-slate-50">
        <div className="flex h-screen bg-slate-50">
          {/* Sidebar */}
          <CustomerSidebar />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-slate-50">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
