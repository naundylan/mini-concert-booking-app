'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, Loader2, MapPin, QrCode, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { customerBookingService } from '@/lib/services/customer-booking.service'
import { CustomerTicketDTO, PageResponse } from '@/lib/types/customer-booking.type'

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
  err?.response?.data?.message || 'Không tải được danh sách vé.'

export default function MyTicketsPage() {
  const [ticketsPage, setTicketsPage] = useState<PageResponse<CustomerTicketDTO> | null>(null)
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true)
        setError('')
        setTicketsPage(await customerBookingService.getTickets({ page, size: 10 }))
      } catch (err: any) {
        setError(getApiErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    loadTickets()
  }, [page])

  const tickets = ticketsPage?.content || []
  const filteredTickets = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return tickets
    return tickets.filter((ticket) => {
      const ticketId = ticket.ticketId || ticket.id
      return (
        ticketId.toLowerCase().includes(normalized) ||
        ticket.orderCode?.toLowerCase().includes(normalized) ||
        ticket.eventName?.toLowerCase().includes(normalized)
      )
    })
  }, [keyword, tickets])

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Vé của tôi</h1>
          <p className="mt-1 text-sm text-slate-600">Xem vé điện tử và thông tin check-in của bạn.</p>
        </div>

        <div className="relative min-w-[280px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo mã vé, đơn hàng, sự kiện..."
            className="pl-10"
          />
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
          Đang tải vé...
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card className="border border-dashed border-slate-300 p-12 text-center">
          <p className="text-sm text-slate-600">Bạn chưa có vé phù hợp.</p>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredTickets.map((ticket) => {
            const ticketId = ticket.ticketId || ticket.id
            const qrPayload = ticket.qrPayload || ticketId
            return (
              <Card key={ticketId} className="border border-slate-200 bg-white p-4">
                <div className="flex gap-4">
                  <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 p-1.5 shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`}
                      alt="Mã QR Vé"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="line-clamp-2 font-bold text-slate-950">{ticket.eventName || 'Sự kiện'}</h2>
                        <p className="mt-1 text-xs text-slate-500">Mã vé: {ticketId}</p>
                      </div>
                      <Badge className="bg-indigo-50 text-indigo-700">{ticket.status || 'UNUSED'}</Badge>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p className="font-semibold text-slate-900">
                        Ghế {ticket.label || ticket.seatLabel} - {ticket.ticketClassName || ticket.ticketClass?.name}
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar size={15} className="text-indigo-600" />
                        {formatDateTime(ticket.eventStartTime)}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin size={15} className="text-indigo-600" />
                        {ticket.eventLocation || '--'}
                      </p>
                      <p className="font-semibold text-indigo-600">{formatMoney(ticket.price)}</p>
                    </div>

                    <p className="mt-3 break-all rounded bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      QR payload: {qrPayload}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {ticketsPage && ticketsPage.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Hiển thị {filteredTickets.length} / {ticketsPage.totalElements} vé
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={page <= 0} onClick={() => setPage((current) => current - 1)}>
              Trước
            </Button>
            <span className="text-sm text-slate-600">
              {page + 1}/{ticketsPage.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= ticketsPage.totalPages - 1}
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
