'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Calendar, CreditCard, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

// Mock Data for Sales History
const SALES_HISTORY = [
  {
    id: '#TK-88219',
    customer: 'Julianna Dubois',
    avatar: 'JD',
    avatarColor: 'bg-indigo-500',
    amount: '$124.50',
    method: 'Visa',
    methodBadgeColor: 'bg-purple-100 text-purple-700',
    timestamp: 'Oct 24, 2023 • 14:32',
    action: 'Receipt',
  },
  {
    id: '#TK-88220',
    customer: 'Marcus Sterling',
    avatar: 'MS',
    avatarColor: 'bg-pink-500',
    amount: '$45.00',
    method: 'Cash',
    methodBadgeColor: 'bg-gray-100 text-gray-700',
    timestamp: 'Oct 24, 2023 • 14:45',
    action: 'Receipt',
  },
  {
    id: '#TK-88221',
    customer: 'Elena Lopez',
    avatar: 'EL',
    avatarColor: 'bg-indigo-600',
    amount: '$210.00',
    method: 'Apple Pay',
    methodBadgeColor: 'bg-slate-100 text-slate-700',
    timestamp: 'Oct 24, 2023 • 15:10',
    action: 'Receipt',
  },
  {
    id: '#TK-88222',
    customer: 'Brian Kim',
    avatar: 'BK',
    avatarColor: 'bg-purple-500',
    amount: '$89.99',
    method: 'Mastercard',
    methodBadgeColor: 'bg-orange-100 text-orange-700',
    timestamp: 'Oct 24, 2023 • 15:55',
    action: 'Receipt',
  },
  {
    id: '#TK-88223',
    customer: 'Sarah Ahmed',
    avatar: 'SA',
    avatarColor: 'bg-red-500',
    amount: '$34.00',
    method: 'Cash',
    methodBadgeColor: 'bg-gray-100 text-gray-700',
    timestamp: 'Oct 24, 2023 • 16:20',
    action: 'Receipt',
  },
]

// Mock Data for Check-in History
const CHECKIN_HISTORY = [
  {
    id: '#ORD-8829-XJ',
    customer: 'Sarah Jenkins',
    avatar: 'SJ',
    avatarColor: 'bg-teal-500',
    eventName: 'Neon Nights Festival',
    seatLocation: 'Sec A, Row 14, Col B2',
    timestamp: 'Oct 24, 2023 • 19:42',
    status: 'SUCCESS',
    action: 'Details',
  },
  {
    id: '#ORD-8830-YK',
    customer: 'Michael Chen',
    avatar: 'MC',
    avatarColor: 'bg-blue-500',
    eventName: 'Jazz in the Park',
    seatLocation: 'Gen Admission',
    timestamp: 'Oct 24, 2023 • 19:55',
    status: 'SUCCESS',
    action: 'Details',
  },
  {
    id: '#ORD-8831-ZL',
    customer: 'Emma Wilson',
    avatar: 'EW',
    avatarColor: 'bg-rose-500',
    eventName: 'A Midsummer Night\'s Dream',
    seatLocation: 'Sec B, Row 8, Col F5',
    timestamp: 'Oct 24, 2023 • 20:10',
    status: 'SUCCESS',
    action: 'Details',
  },
  {
    id: '#ORD-8832-AM',
    customer: 'James Rodriguez',
    avatar: 'JR',
    avatarColor: 'bg-cyan-500',
    eventName: 'Tech Summit 2024',
    seatLocation: 'VIP Section',
    timestamp: 'Oct 24, 2023 • 20:25',
    status: 'SUCCESS',
    action: 'Details',
  },
]

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<'sales' | 'checkin'>('sales')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredSales = SALES_HISTORY.filter(
    (item) =>
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCheckins = CHECKIN_HISTORY.filter(
    (item) =>
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const displayData = activeTab === 'sales' ? filteredSales : filteredCheckins
  const totalPages = Math.ceil(displayData.length / itemsPerPage)
  const paginatedData = displayData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <main className="flex-1 overflow-auto bg-white">
      {/* Page Header */}
      <div className="px-8 py-6 border-b border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Internal Logs</h1>
      </div>

      <div className="p-8">
        {/* Tabs */}
        <div className="flex gap-8 border-b border-slate-200 mb-6">
          <button
            onClick={() => {
              setActiveTab('sales')
              setCurrentPage(1)
              setSearchQuery('')
            }}
            className={`pb-3 font-medium text-sm transition-colors ${
              activeTab === 'sales'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-700'
            }`}
          >
            Sales History
          </button>
          <button
            onClick={() => {
              setActiveTab('checkin')
              setCurrentPage(1)
              setSearchQuery('')
            }}
            className={`pb-3 font-medium text-sm transition-colors ${
              activeTab === 'checkin'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-700'
            }`}
          >
            Check-in History
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                type="text"
                placeholder={
                  activeTab === 'sales'
                    ? 'Search Booking ID or customer...'
                    : 'Search Order ID or customer...'
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 bg-slate-50 border-slate-200 text-sm"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-slate-700"
            >
              <Calendar size={16} />
              Date Range
            </Button>
            {activeTab === 'sales' && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-slate-700"
              >
                <CreditCard size={16} />
                Payment Method
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <Filter size={16} className="text-slate-600" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-slate-50 rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                {activeTab === 'sales' ? (
                  <>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">BOOKING ID</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">CUSTOMER</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">AMOUNT</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">METHOD</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">TIMESTAMP</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">ACTION</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">ORDER ID</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">CUSTOMER</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">EVENT</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">SEAT LOCATION</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">TIMESTAMP</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700">ACTION</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                >
                  {activeTab === 'sales' ? (
                    <>
                      <td className="px-6 py-4 font-medium text-indigo-600">
                        {item.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full ${item.avatarColor} flex items-center justify-center text-white text-xs font-semibold`}
                          >
                            {item.avatar}
                          </div>
                          <span className="text-slate-900">{item.customer}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {item.amount}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${item.methodBadgeColor} text-xs font-medium`}>
                          {item.method}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {item.timestamp}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                          {item.action}
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-medium text-indigo-600">
                        {item.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full ${item.avatarColor} flex items-center justify-center text-white text-xs font-semibold`}
                          >
                            {item.avatar}
                          </div>
                          <span className="text-slate-900">{item.customer}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-900">{item.eventName}</td>
                      <td className="px-6 py-4 text-slate-600">{item.seatLocation}</td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {item.timestamp}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                          {item.action}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-slate-600">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, displayData.length)}-
            {Math.min(currentPage * itemsPerPage, displayData.length)} of {displayData.length} transactions
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2"
            >
              <ChevronLeft size={16} className="text-slate-600" />
            </Button>

            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map(
              (page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={
                    currentPage === page
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'text-slate-700'
                  }
                >
                  {page}
                </Button>
              )
            )}

            {totalPages > 3 && (
              <>
                <span className="text-slate-400">...</span>
                {totalPages > 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className="text-slate-700"
                  >
                    {totalPages}
                  </Button>
                )}
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2"
            >
              <ChevronRight size={16} className="text-slate-600" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
