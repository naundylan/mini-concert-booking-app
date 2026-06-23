'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Palette } from 'lucide-react';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { label: 'Tài khoản', icon: User, href: '/customer/settings/account' },
    { label: 'Giao diện', icon: Palette, href: '/customer/settings/appearance' },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Cài đặt</h1>
        <p className="mt-1 text-sm text-slate-600">
          Quản lý tài khoản cá nhân và tùy chọn giao diện hiển thị.
        </p>
      </div>

      <div className="h-px bg-slate-200"></div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Side: Navigation Links */}
        <aside className="w-full shrink-0 lg:w-60">
          <nav className="flex flex-row gap-2 lg:flex-col lg:space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-1 items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors lg:flex-none ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Right Side: Main Content */}
        <main className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
}
