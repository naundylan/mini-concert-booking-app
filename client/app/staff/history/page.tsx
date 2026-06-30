'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { checkInService } from '@/lib/services/check-in.service'
import { CheckInHistoryItem } from '@/lib/types/check-in.type'
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  Search,
  TicketCheck,
  UserCheck,
} from 'lucide-react'

const ITEMS_PER_PAGE = 10

function formatDateTime(value?: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatCurrency(value?: number | null) {
  if (value == null) return '-'

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function getInitials(name?: string | null) {
  if (!name) return 'KH'

  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    return response?.data?.message || 'Không tải được lịch sử soát vé'
  }

  return 'Không tải được lịch sử soát vé'
}

export default function HistoryPage() {
  const [history, setHistory] = useState<CheckInHistoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = async (keyword = appliedKeyword) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await checkInService.getHistory({ keyword })
      setHistory(data)
      setCurrentPage(1)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHistory('')
  }, [])

  const eventOptions = useMemo(() => {
    const eventMap = new Map<string, string>()
    history.forEach((item) => {
      if (item.eventId) {
        eventMap.set(item.eventId, item.eventName || 'Sự kiện không tên')
      }
    })

    return Array.from(eventMap, ([id, name]) => ({ id, name }))
  }, [history])

  const filteredHistory = useMemo(() => {
    if (selectedEventId === 'all') return history
    return history.filter((item) => item.eventId === selectedEventId)
  }, [history, selectedEventId])

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ITEMS_PER_PAGE))
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const totalTickets = filteredHistory.length
  const uniqueOrders = new Set(filteredHistory.map((item) => item.orderId).filter(Boolean)).size
  const latestCheckIn = filteredHistory[0]?.checkInTime

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const keyword = searchQuery.trim()
    setAppliedKeyword(keyword)
    setSelectedEventId('all')
    loadHistory(keyword)
  }

  const handleRefresh = () => {
    loadHistory(appliedKeyword)
  }

  return (
    <main className="flex-1 overflow-auto bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-slate-950">Lịch sử soát vé</h1>
          <p className="text-sm text-slate-600">
            Theo dõi các vé đã được soát tại cổng, nhân viên xử lý và thời điểm soát.
          </p>
        </div>
      </div>

      <div className="space-y-6 p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <TicketCheck size={20} />
            </div>
            <p className="text-sm text-slate-500">Vé đã soát</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{totalTickets}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <CalendarCheck size={20} />
            </div>
            <p className="text-sm text-slate-500">Đơn hàng liên quan</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{uniqueOrders}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock size={20} />
            </div>
            <p className="text-sm text-slate-500">Check-in gần nhất</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              {formatDateTime(latestCheckIn)}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <form onSubmit={handleSearch} className="flex flex-1 gap-3">
              <div className="relative max-w-xl flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  type="text"
                  placeholder="Tìm mã đơn, tên khách, SĐT hoặc ghế..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-10 border-slate-200 bg-slate-50 pl-10 text-sm"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="h-10 bg-indigo-600 text-white hover:bg-indigo-700">
                Tìm kiếm
              </Button>
            </form>

            <div className="flex gap-3">
              <select
                value={selectedEventId}
                onChange={(event) => {
                  setSelectedEventId(event.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="all">Tất cả sự kiện</option>
                {eventOptions.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-10 gap-2"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                Làm mới
              </Button>
            </div>
          </div>

          {error && (
            <div className="mx-5 mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-3 text-left font-semibold text-slate-700">Mã đơn</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-700">Khách hàng</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-700">Sự kiện</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-700">Ghế</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-700">Check-in</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-700">Nhân viên</th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-700">Giá vé</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                      Chưa có lịch sử soát vé phù hợp.
                    </td>
                  </tr>
                )}

                {!isLoading && paginatedHistory.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                      Chưa có lịch sử soát vé phù hợp.
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  paginatedHistory.map((item) => (
                    <tr
                      key={item.ticketId}
                      className="border-b border-slate-100 bg-white transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-indigo-700">{item.orderCode || '-'}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.ticketId}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                            {getInitials(item.customerName)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-950">
                              {item.customerName || 'Khách hàng'}
                            </div>
                            <div className="text-xs text-slate-500">{item.phone || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-800">{item.eventName || '-'}</td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">
                          {item.ticketClassName || 'Hạng vé'}
                        </div>
                        <div className="text-xs text-slate-500">{item.seatLabel || '-'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge className="mb-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          Đã vào cổng
                        </Badge>
                        <div className="text-xs text-slate-500">{formatDateTime(item.checkInTime)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <UserCheck size={16} className="text-slate-400" />
                          {item.checkInByName || '-'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-slate-900">
                        {formatCurrency(item.price)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-600">
              Hiển thị {filteredHistory.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}-
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length)} / {filteredHistory.length} vé
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isLoading}
                className="h-9 w-9 p-0"
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="min-w-20 text-center text-sm text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || isLoading}
                className="h-9 w-9 p-0"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
