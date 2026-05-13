'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TicketIcon, Heart, LogOut } from 'lucide-react'
import { clearAuthSession } from '@/lib/auth-client'

export default function CustomerSidebar() {
  const pathname = usePathname()

  const menuItems = [
    { label: 'Home', icon: Home, href: '/customer' },
    { label: 'Events', icon: TicketIcon, href: '/customer/events' },
    { label: 'My Tickets', icon: TicketIcon, href: '/customer/my-tickets' },
    { label: 'Favorites', icon: Heart, href: '/customer/favorites' },
  ]

  const handleLogout = () => {
    clearAuthSession()
    window.location.href = '/auth'
  }

  return (
    <aside className="w-56 bg-indigo-950 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-indigo-900">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            K
          </div>
          <div>
            <h2 className="font-bold text-white">Kinetic</h2>
            <h3 className="font-bold text-white">Curator</h3>
            <p className="text-xs text-indigo-300">Booking Portal</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
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
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-900/50 transition-colors"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
