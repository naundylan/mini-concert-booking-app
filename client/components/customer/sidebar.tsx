'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TicketIcon, Heart, LogOut, Settings, X } from 'lucide-react'
import { authService } from '@/lib/services/auth.service'

type SidebarProps = {
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export default function CustomerSidebar({ mobileOpen = false, onCloseMobile = () => {} }: SidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    { label: 'Trang chủ', icon: Home, href: '/customer' },
    { label: 'Sự kiện', icon: TicketIcon, href: '/customer/events' },
    { label: 'Vé của tôi', icon: TicketIcon, href: '/customer/my-tickets' },
    { label: 'Cài đặt', icon: Settings, href: '/customer/settings' },
  ]

  const handleLogout = () => {
    authService.logout()
  }

  const content = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-indigo-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            K
          </div>
          <div>
            <h2 className="font-bold text-white leading-none text-sm">Kinetic</h2>
            <h3 className="font-bold text-white leading-none text-sm mt-0.5">Curator</h3>
            <p className="text-[10px] text-indigo-300">Booking Portal</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-indigo-200 hover:bg-indigo-900/60 lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-indigo-200 hover:text-white hover:bg-indigo-900/50'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-indigo-900">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-900/50 transition-colors text-left"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </>
  )

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
        className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col bg-indigo-950 text-white transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-56 bg-indigo-950 text-white h-screen shrink-0">
        {content}
      </aside>
    </>
  )
}
