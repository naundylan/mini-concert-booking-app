'use client';

import React from 'react';
import Sidebar from '@/components/admin/sidebar';
import Header from '@/components/admin/header';
import RoleGuard from '@/components/auth/role-guard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRole="ADMIN">
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header />

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
