'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, Menu } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type HeaderProps = {
  onOpenSidebar?: () => void;
};

export default function CustomerHeader({ onOpenSidebar = () => {} }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 lg:hidden">
      {/* Mobile Menu Toggle */}
      <button
        type="button"
        onClick={onOpenSidebar}
        className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 mr-2"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Brand logo for mobile header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs">
          K
        </div>
        <span className="font-bold text-slate-900 text-sm">Kinetic</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <Link href="/customer/settings" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Settings size={18} className="text-slate-600" />
        </Link>
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
            CU
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
