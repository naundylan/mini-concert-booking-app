'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/shared/sidebar';
import Header from '@/components/admin/header';
import RoleGuard from '@/components/auth/role-guard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <RoleGuard allowedRole="ADMIN">
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar
          role="ADMIN"
          collapsed={sidebarCollapsed}
          mobileOpen={sidebarOpen}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header onOpenSidebar={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-5 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
