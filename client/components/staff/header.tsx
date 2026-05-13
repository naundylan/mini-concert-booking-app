'use client';

import React from 'react';
import { Bell, Settings } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Spacer for alignment */}
      <div className="flex-1" />

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Notification Bell */}
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative">
          <Bell size={20} className="text-slate-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Settings Icon */}
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Settings size={20} className="text-slate-600" />
        </button>

        {/* User Avatar */}
        <Avatar className="w-9 h-9 cursor-pointer">
          <AvatarFallback className="bg-indigo-600 text-white text-sm font-bold">
            AR
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
