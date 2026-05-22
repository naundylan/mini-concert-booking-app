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
    <div className="flex h-full flex-col lg:flex-row">
      <aside className="w-full border-b border-slate-200 bg-white px-4 py-4 lg:w-56 lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 lg:mb-8">Settings</h2>
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-3">
          {SETTINGS_MENU.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex shrink-0 items-center gap-3 rounded-lg px-4 py-2.5 transition-all',
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

      <div className="flex-1 overflow-auto bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </div>
    </div>
  );
}
