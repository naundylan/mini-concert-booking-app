'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Bell, Settings, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

type HeaderProps = {
  onOpenSidebar: () => void;
};

export default function Header({ onOpenSidebar }: HeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-4 lg:h-14 lg:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
        aria-label="Mở menu quản trị"
      >
        <Menu size={21} />
      </button>

      <div className="hidden max-w-sm flex-1 sm:block">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            type="text"
            placeholder="Tìm kiếm sự kiện, người dùng hoặc chỉ số..."
            className="h-9 border-slate-200 bg-slate-50 pl-10 text-sm"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button className="relative rounded-lg p-2 transition-colors hover:bg-slate-100">
          <Bell size={18} className="text-slate-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <Link
          href="/admin/settings/profile"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Đi tới Cài đặt"
        >
          <Settings size={18} className="text-slate-600" />
        </Link>

        <Avatar className="h-8 w-8 cursor-pointer border border-slate-200 sm:h-9 sm:w-9">
          <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" />
          <AvatarFallback className="bg-indigo-600 text-white">AM</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
