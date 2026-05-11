'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Palette, Lock, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const SETTINGS_MENU = [
  { label: 'Profile', href: '/admin/settings/profile', icon: User },
  { label: 'Appearance', href: '/admin/settings/appearance', icon: Palette },
  { label: 'Security', href: '/admin/settings/security', icon: Lock },
  { label: 'Notifications', href: '/admin/settings/notifications', icon: Bell },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full">
      {/* Settings Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200 px-6 py-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-8">Settings</h2>
        <nav className="flex flex-col gap-3">
          {SETTINGS_MENU.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all',
                  isActive
                    ? 'bg-indigo-100 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Settings Content */}
      <div className="flex-1 px-8 py-8 bg-slate-50 overflow-auto">
        {children}
      </div>
    </div>
  );
}