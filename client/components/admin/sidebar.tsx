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

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [userFullName, setUserFullName] = useState("Guest");

  useEffect(() => {
    authService
      .getMe()
      .then((session) => {
        if (session.userInfo?.fullName) {
          setUserFullName(session.userInfo.fullName);
        }
      })
      .catch(() => undefined);
  }, []);

  const handleLogout = () => {
    authService.logout();
  };

  const handleMyProfile = () => {
    console.log('Navigate to profile');
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col h-screen border-r border-indigo-900">
      <div className="p-6 border-b border-indigo-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg">
            K
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight"></h1>
            <p className="text-xs text-indigo-300">Ticket</p>
            <p className="text-xs text-slate-400">Admin Console</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-indigo-900/50 transition-colors text-sm font-medium">
                <Icon size={18} className="text-indigo-400" />
                <span>{item.label}</span>
              </button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-indigo-900">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-indigo-900/50 transition-colors">
              <Avatar className="w-10 h-10 border border-indigo-400">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" />
                <AvatarFallback className="bg-indigo-600 text-white">AM</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{userFullName}</p>
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
    </aside>
  );
}
