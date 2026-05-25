'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Calendar, CheckCircle, Loader2, MapPin, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { customerBookingService } from '@/lib/services/customer-booking.service'
import { CustomerOrderDTO } from '@/lib/types/customer-booking.type'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)

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

const getApiErrorMessage = (err: any) =>
  err?.response?.data?.message || 'Không tải được thông tin đơn hàng.'

export default function BookingSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState<CustomerOrderDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError('Thiếu mã đơn hàng.')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError('')
        setOrder(await customerBookingService.getOrder(orderId))
      } catch (err: any) {
        setError(getApiErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm text-slate-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" />
        Đang tải vé của bạn...
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="space-y-4 p-6 lg:p-8">
        <Card className="border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</Card>
        <Link href="/customer/events">
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700">Về danh sách sự kiện</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle size={34} className="text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-950">Đặt vé thành công</h1>
          <p className="mt-2 text-sm text-slate-600">
            Mã đơn hàng <span className="font-semibold text-slate-900">{order.orderCode}</span>
          </p>
        </div>

        <Card className="overflow-hidden border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-indigo-950 p-6 text-white">
            <h2 className="text-2xl font-bold">{order.eventName || 'Sự kiện'}</h2>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/80">
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} />
                {order.eventLocation || '--'}
              </span>
              <span className="inline-flex items-center gap-2">
                <Calendar size={16} />
                {formatDateTime(order.eventStartTime)}
              </span>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Trạng thái</p>
              <p className="mt-1 font-bold text-emerald-600">{order.status}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Thanh toán</p>
              <p className="mt-1 font-bold text-slate-900">{order.paymentStatus}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Tổng tiền</p>
              <p className="mt-1 font-bold text-indigo-600">{formatMoney(order.totalAmount)}</p>
            </div>
          </div>

          <div className="space-y-3 px-6 pb-6">
            <h3 className="font-bold text-slate-950">Vé điện tử</h3>
            {order.items.map((ticket) => {
              const ticketId = ticket.ticketId || ticket.id
              const qrPayload = ticket.qrPayload || ticketId
              return (
                <div key={ticketId} className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <QrCode size={42} className="text-slate-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-950">Ghế {ticket.label || ticket.seatLabel}</p>
                    <p className="text-sm text-slate-600">{ticket.ticketClassName || ticket.ticketClass?.name}</p>
                    <p className="mt-2 break-all text-xs text-slate-500">QR payload: {qrPayload}</p>
                  </div>
                  <p className="font-bold text-indigo-600">{formatMoney(ticket.price)}</p>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/customer/my-tickets">
            <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-700">Xem vé của tôi</Button>
          </Link>
          <Link href="/customer/events">
            <Button variant="outline" className="w-full">Xem sự kiện khác</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
