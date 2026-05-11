'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Bell, Settings, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';


export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            type="text"
            placeholder="Search events, users, or metrics..."
            className="pl-10 bg-slate-50 border-slate-200 text-sm"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Notification Bell */}
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative">
          <Bell size={20} className="text-slate-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Settings Icon - Direct Link */}
        <Link
          href="/admin/settings/security"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Go to Settings"
        >
          <Settings size={20} className="text-slate-600" />
        </Link>

        {/* User Avatar */}
        <Avatar className="w-10 h-10 border border-slate-200 cursor-pointer">
          <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" />
          <AvatarFallback className="bg-indigo-600 text-white">AM</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}