'use client';

import React from 'react';
import Sidebar from '@/components/staff/sidebar';
import Header from '@/components/staff/header';
import RoleGuard from '@/components/auth/role-guard';

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRole="STAFF">
      <div className="flex h-screen bg-slate-50">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto px-8 py-6">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
