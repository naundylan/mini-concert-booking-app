'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const SETTINGS_MENU = [
  { label: 'Thông tin cá nhân', href: '/staff/settings/profile', icon: User },
  { label: 'Bảo mật', href: '/staff/settings/security', icon: Lock },
];

export default function StaffSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Sidebar navigation */}
      <aside className="w-full border-b border-slate-200 bg-white px-4 py-4 lg:w-56 lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 lg:mb-8">Cài đặt</h2>
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-3">
          {SETTINGS_MENU.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex shrink-0 items-center gap-3 rounded-lg px-4 py-2.5 transition-all text-sm font-medium',
                  isActive
                    ? 'bg-indigo-100 text-indigo-700 font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content area */}
      <div className="flex-1 overflow-auto bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </div>
    </div>
  );
}
