'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Calendar, Loader2, MapPin, Search, Ticket } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { customerBookingService } from '@/lib/services/customer-booking.service'
import {
  CustomerEventStatus,
  CustomerEventSummaryDTO,
  PageResponse,
} from '@/lib/types/customer-booking.type'

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Chưa có lịch'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)

const getApiErrorMessage = (err: any) => {
  const body = err?.response?.data
  return body?.message || 'Không tải được dữ liệu. Vui lòng thử lại.'
}

const getMinPrice = (event: CustomerEventSummaryDTO) => {
  const prices = event.ticketClasses?.map((ticketClass) => ticketClass.price) || []
  if (prices.length === 0) return null
  return Math.min(...prices)
}

export default function EventsPage() {
  const [eventsPage, setEventsPage] = useState<PageResponse<CustomerEventSummaryDTO> | null>(null)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<CustomerEventStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true)
        setError('')
        const data = await customerBookingService.getEvents({
          keyword: keyword.trim() || undefined,
          status,
          page,
          size: 9,
        })
        setEventsPage(data)
      } catch (err: any) {
        setError(getApiErrorMessage(err))
        setEventsPage(null)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [keyword, status, page])

  const events = eventsPage?.content || []

  const totalLabel = useMemo(() => {
    if (!eventsPage) return ''
    return `Hiển thị ${events.length} / ${eventsPage.totalElements} sự kiện`
  }, [events.length, eventsPage])

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Sự kiện</h1>
          <p className="mt-1 text-sm text-slate-600">
            Xem sự kiện sắp mở bán và đặt vé cho sự kiện đang mở bán.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-[260px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value)
                setPage(0)
              }}
              placeholder="Tìm tên sự kiện, địa điểm..."
              className="pl-10"
            />
          </div>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as CustomerEventStatus | 'ALL')
              setPage(0)
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Tất cả</option>
            <option value="ONSALE">Đang mở bán</option>
            <option value="TEASING">Sắp mở bán</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-slate-600">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" />
          Đang tải sự kiện...
        </div>
      ) : events.length === 0 ? (
        <Card className="border border-dashed border-slate-300 p-12 text-center">
          <p className="text-sm text-slate-600">Không tìm thấy sự kiện phù hợp.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => {
            const minPrice = getMinPrice(event)
            const isOnSale = event.status === 'ONSALE'

            return (
              <Card key={event.id} className="overflow-hidden border border-slate-200 bg-white">
                <div className="relative h-44 bg-slate-200">
                  {event.bannerUrl ? (
                    <img src={event.bannerUrl} alt={event.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-indigo-50 text-indigo-500">
                      <Ticket size={42} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                  <Badge
                    className={`absolute right-3 top-3 border-0 text-white ${
                      isOnSale ? 'bg-emerald-500' : 'bg-violet-500'
                    }`}
                  >
                    {isOnSale ? 'Đang mở bán' : 'Sắp mở bán'}
                  </Badge>
                </div>

                <div className="space-y-4 p-4">
                  <div>
                    <h2 className="line-clamp-2 text-lg font-bold text-slate-950">{event.name}</h2>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={16} className="text-indigo-600" />
                      <span className="line-clamp-1">{event.location}</span>
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                      <Calendar size={16} className="text-indigo-600" />
                      {formatDateTime(event.startTime)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Giá từ</p>
                      <p className="font-semibold text-slate-900">
                        {minPrice == null ? 'Chưa công bố' : formatMoney(minPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Ghế còn</p>
                      <p className="font-semibold text-slate-900">
                        {event.seatSummary ? `${event.seatSummary.available}/${event.seatSummary.total}` : '--'}
                      </p>
                    </div>
                  </div>

                  <Link href={`/customer/events/${event.id}`}>
                    <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
                      Xem chi tiết
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {eventsPage && eventsPage.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">{totalLabel}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={page <= 0} onClick={() => setPage((current) => current - 1)}>
              Trước
            </Button>
            <span className="text-sm text-slate-600">
              {page + 1}/{eventsPage.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= eventsPage.totalPages - 1}
              onClick={() => setPage((current) => current + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
