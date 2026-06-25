'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingCart,
  QrCode,
  Clock,
  LogOut,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { authService } from '@/lib/services/auth.service';

const STAFF_MENU_ITEMS = [
  { label: 'POS', icon: ShoppingCart, href: '/staff/pos' },
  { label: 'Check-in', icon: QrCode, href: '/staff/check-in' },
  { label: 'History', icon: Clock, href: '/staff/history' },
];

import { X } from 'lucide-react';

type SidebarProps = {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export default function Sidebar({ mobileOpen = false, onCloseMobile = () => {} }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = () => {
    authService.logout();
  };

  const content = (
    <>
      {/* Logo Section */}
      <div className="p-6 border-b border-indigo-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white">
            K
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white">Kinetic</h1>
            <p className="text-xs text-indigo-300">Staff Portal</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {STAFF_MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-indigo-900">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors text-left">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-indigo-600 text-white text-sm font-bold">
                  AR
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-white truncate">Alex Rivera</p>
                <p className="text-xs text-slate-400">Staff</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer">
              <User size={16} className="mr-2" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}>
              <LogOut size={16} className="mr-2" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 transition-opacity lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onCloseMobile}
      />

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white h-screen border-r border-indigo-900 shrink-0">
        {content}
      </aside>
    </>
  );
}
