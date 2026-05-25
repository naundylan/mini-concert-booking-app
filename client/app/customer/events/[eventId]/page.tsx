'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, ChevronLeft, Loader2, MapPin, Ticket } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { customerBookingService } from '@/lib/services/customer-booking.service'
import { CustomerEventDetailDTO } from '@/lib/types/customer-booking.type'

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

const getApiErrorMessage = (err: any) =>
  err?.response?.data?.message || 'Không tải được chi tiết sự kiện.'

export default function CustomerEventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = String(params.eventId || '')
  const [event, setEvent] = useState<CustomerEventDetailDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true)
        setError('')
        setEvent(await customerBookingService.getEventDetail(eventId))
      } catch (err: any) {
        setError(getApiErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    if (eventId) loadEvent()
  }, [eventId])

  const ticketClasses = event?.ticketClasses || []
  const minPrice = useMemo(() => {
    if (ticketClasses.length === 0) return null
    return Math.min(...ticketClasses.map((ticketClass) => ticketClass.price))
  }, [ticketClasses])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" />
        Đang tải chi tiết sự kiện...
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="space-y-4 p-6 lg:p-8">
        <Link href="/customer/events" className="inline-flex items-center gap-2 text-sm text-indigo-600">
          <ChevronLeft size={16} />
          Quay lại danh sách
        </Link>
        <Card className="border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</Card>
      </div>
    )
  }

  const isOnSale = event.status === 'ONSALE'

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <Link href="/customer/events" className="inline-flex items-center gap-2 text-sm text-indigo-600">
        <ChevronLeft size={16} />
        Quay lại danh sách
      </Link>

      <Card className="overflow-hidden border border-slate-200 bg-white">
        <div className="relative h-72 bg-slate-200">
          {event.bannerUrl ? (
            <img src={event.bannerUrl} alt={event.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-indigo-50 text-indigo-500">
              <Ticket size={64} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <Badge className={`mb-4 border-0 ${isOnSale ? 'bg-emerald-500' : 'bg-violet-500'}`}>
              {isOnSale ? 'Đang mở bán' : 'Sắp mở bán'}
            </Badge>
            <h1 className="max-w-4xl text-4xl font-bold">{event.name}</h1>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/90">
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} />
                {event.location}
              </span>
              <span className="inline-flex items-center gap-2">
                <Calendar size={16} />
                {formatDateTime(event.startTime)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-950">Thông tin sự kiện</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Mở bán</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(event.openTime)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Bắt đầu</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(event.startTime)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Kết thúc</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(event.endTime)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Địa điểm</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{event.location}</p>
              </div>
            </div>
            {event.description && <p className="mt-5 text-sm leading-6 text-slate-600">{event.description}</p>}
          </Card>

          {isOnSale && (
            <Card className="border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-slate-950">Hạng vé</h2>
              <div className="mt-4 space-y-3">
                {ticketClasses.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                    Sự kiện chưa công bố hạng vé.
                  </p>
                ) : (
                  ticketClasses.map((ticketClass) => (
                    <div
                      key={ticketClass.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: ticketClass.colorCode || '#4f46e5' }}
                        />
                        <span className="font-semibold text-slate-900">{ticketClass.name}</span>
                      </div>
                      <span className="font-bold text-indigo-600">{formatMoney(ticketClass.price)}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="sticky top-6 border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-950">Đặt vé</h2>
            <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Giá từ</span>
                <span className="font-semibold text-slate-900">
                  {minPrice == null ? 'Chưa công bố' : formatMoney(minPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ghế còn</span>
                <span className="font-semibold text-slate-900">
                  {event.seatSummary ? `${event.seatSummary.available}/${event.seatSummary.total}` : '--'}
                </span>
              </div>
            </div>

            {isOnSale ? (
              <Button
                className="mt-5 w-full bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={() => router.push(`/customer/booking/${event.id}/seats`)}
              >
                Mua vé
              </Button>
            ) : (
              <Button className="mt-5 w-full" disabled>
                Sắp mở bán
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
