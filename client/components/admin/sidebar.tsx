'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Calendar,
  Users,
  Map,
  TrendingUp,
  LogOut,
  User,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { authService } from '@/lib/services/auth.service';

const MENU_ITEMS = [
  { label: 'Dashboard', icon: BarChart3, href: '/admin/dashboard' },
  { label: 'Events', icon: Calendar, href: '/admin/events' },
  { label: 'Layouts', icon: Map, href: '/admin/layouts' },
  { label: 'Staff', icon: Users, href: '/admin/staff' },
  { label: 'Reports', icon: TrendingUp, href: '/admin/reports' },
];

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
};

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userFullName, setUserFullName] = useState('Guest');

  useEffect(() => {
    authService
      .getMe()
      .then((session) => {
        if (session.userInfo?.fullName) setUserFullName(session.userInfo.fullName);
      })
      .catch(() => undefined);
  }, []);

  const handleLogout = () => {
    authService.logout();
  };

  const handleMyProfile = () => {
    console.log('Navigate to profile');
  };

  const content = (
    <>
      <div className={`border-b border-indigo-900 ${collapsed ? 'p-4' : 'p-6'}`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'lg:justify-center' : ''}`}>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold transition hover:bg-indigo-500"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            K
          </button>
          <div className={collapsed ? 'lg:hidden' : 'block'}>
            <h1 className="font-bold tracking-tight">Ticket</h1>
            <p className="text-xs text-slate-400">Admin Console</p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="ml-auto rounded-lg p-2 text-slate-300 hover:bg-indigo-900/60 lg:hidden"
            aria-label="Close admin menu"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={onCloseMobile}>
              <button
                className={`flex w-full items-center rounded-lg py-3 text-sm font-medium transition-colors hover:bg-indigo-900/50 ${
                  collapsed ? 'justify-center px-2 lg:gap-0' : 'gap-3 px-4'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="shrink-0 text-indigo-400" />
                <span className={collapsed ? 'lg:hidden' : 'inline'}>{item.label}</span>
              </button>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-indigo-900 p-4">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className={`flex w-full items-center rounded-lg py-3 transition-colors hover:bg-indigo-900/50 ${
                collapsed ? 'justify-center px-2 lg:gap-0' : 'gap-3 px-3'
              }`}
            >
              <Avatar className="h-10 w-10 border border-indigo-400">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" />
                <AvatarFallback className="bg-indigo-600 text-white">AM</AvatarFallback>
              </Avatar>
              <div className={collapsed ? 'hidden' : 'min-w-0 flex-1 text-left'}>
                <p className="truncate text-sm font-medium">{userFullName}</p>
                <p className="text-xs text-indigo-300">Admin</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleMyProfile} className="cursor-pointer">
              <User size={16} className="mr-2" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
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
      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 transition-opacity lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onCloseMobile}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-indigo-900 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white transition-all duration-300 lg:static lg:z-auto lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {content}
      </aside>
    </>
  );
}
