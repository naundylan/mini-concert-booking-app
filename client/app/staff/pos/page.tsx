'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Banknote, CheckCircle2, CreditCard, Landmark, Loader2, QrCode, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { posService } from '@/lib/services/pos.service'
import {
  CustomerLookupDTO,
  OrderItemResponseDTO,
  OrderResponseDTO,
  PaymentMethod,
  PosEvent,
  SeatCatalogDTO,
} from '@/lib/types/pos.type'

const PAYMENT_OPTIONS: Array<{
  value: PaymentMethod
  title: string
  description: string
  icon: React.ElementType
  disabled?: boolean
}> = [
  {
    value: 'CASH',
    title: 'Tiền mặt',
    description: 'Staff xác nhận số tiền thực nhận tại quầy',
    icon: Banknote,
  },
  {
    value: 'BANK_TRANSFER',
    title: 'Chuyển khoản ngân hàng',
    description: 'Staff kiểm tra app ngân hàng rồi xác nhận',
    icon: Landmark,
  },
  {
    value: 'VNPAY',
    title: 'VNPay Gateway',
    description: 'Demo UI, chưa kích hoạt ở giai đoạn này',
    icon: QrCode,
    disabled: true,
  },
]

const formatMoney = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)

export default function POSPage() {
  const [events, setEvents] = useState<PosEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [catalog, setCatalog] = useState<SeatCatalogDTO | null>(null)
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerLookup, setCustomerLookup] = useState<CustomerLookupDTO | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [amountReceived, setAmountReceived] = useState('')
  const [loading, setLoading] = useState(true)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [orderResult, setOrderResult] = useState<OrderResponseDTO | null>(null)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)
        const data = await posService.getEvents()
        setEvents(data)
        if (data[0]) {
          setSelectedEventId(data[0].id)
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Không tải được danh sách sự kiện đang bán.')
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  useEffect(() => {
    if (!selectedEventId) return

    const loadCatalog = async () => {
      try {
        setCatalogLoading(true)
        setSelectedSeatIds([])
        const data = await posService.getCatalog(selectedEventId)
        setCatalog(data)
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Không tải được sơ đồ ghế.')
      } finally {
        setCatalogLoading(false)
      }
    }

    loadCatalog()
  }, [selectedEventId])

  useEffect(() => {
    const normalizedPhone = customerPhone.trim()
    if (normalizedPhone.length < 6) {
      setCustomerLookup(null)
      return
    }

    const timer = window.setTimeout(async () => {
      try {
        const data = await posService.lookupCustomer(normalizedPhone)
        setCustomerLookup(data)
        if (data.found) {
          setCustomerName(data.fullName || '')
          setCustomerEmail(data.email || '')
        }
      } catch {
        setCustomerLookup(null)
      }
    }, 450)

    return () => window.clearTimeout(timer)
  }, [customerPhone])

  const selectedSeats = useMemo(() => {
    if (!catalog) return []
    return catalog.seats.filter((seat) => selectedSeatIds.includes(seat.seatId))
  }, [catalog, selectedSeatIds])

  const seatsByRow = useMemo(() => {
    if (!catalog) return []
    const rows = new Map<number, OrderItemResponseDTO[]>()
    for (const seat of catalog.seats) {
      rows.set(seat.gridRow ?? 0, [...(rows.get(seat.gridRow ?? 0) || []), seat])
    }
    return Array.from(rows.entries())
      .sort(([a], [b]) => a - b)
      .map(([row, seats]) => ({
        row,
        label: String.fromCharCode(65 + row),
        seats: seats.sort((a, b) => (a.gridColumn ?? 0) - (b.gridColumn ?? 0)),
      }))
  }, [catalog])

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0)
  const requiresManualConfirmation = paymentMethod === 'CASH' || paymentMethod === 'BANK_TRANSFER'

  const toggleSeat = (seat: OrderItemResponseDTO) => {
    if (seat.seatStatus !== 'AVAILABLE') return
    setOrderResult(null)
    setSelectedSeatIds((current) =>
      current.includes(seat.seatId)
        ? current.filter((id) => id !== seat.seatId)
        : [...current, seat.seatId]
    )
  }

  const clearOrder = () => {
    setSelectedSeatIds([])
    setOrderResult(null)
    setAmountReceived('')
  }

  const handleIssueTickets = async () => {
    setError('')
    setOrderResult(null)

    if (!selectedEventId || !customerPhone.trim() || !customerName.trim() || selectedSeatIds.length === 0) {
      setError('Vui lòng chọn sự kiện, nhập SĐT, tên khách và chọn ít nhất một ghế.')
      return
    }

    const received = Number(amountReceived)
    if (requiresManualConfirmation && (!amountReceived || Number.isNaN(received) || received < totalAmount)) {
      setError('Tiền mặt/chuyển khoản ngân hàng cần số tiền thực nhận tối thiểu bằng tổng đơn.')
      return
    }

    try {
      setSubmitting(true)
      const response = await posService.createOrder({
        eventId: selectedEventId,
        phone: customerPhone.trim(),
        fullName: customerName.trim(),
        email: customerEmail.trim() || undefined,
        seatIds: selectedSeatIds,
        payment: {
          paymentMethod,
          amountReceived: requiresManualConfirmation ? received : undefined,
        },
      })
      setOrderResult(response)
      setSelectedSeatIds([])
      setAmountReceived('')
      if (selectedEventId) {
        setCatalog(await posService.getCatalog(selectedEventId))
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không tạo được đơn hàng.')
    } finally {
      setSubmitting(false)
    }
  }

  const getSeatClassName = (seat: OrderItemResponseDTO) => {
    const isSelected = selectedSeatIds.includes(seat.seatId)
    if (isSelected) return 'bg-amber-300 text-slate-950 ring-2 ring-amber-500'
    if (seat.seatStatus === 'SOLD') return 'bg-slate-300 text-slate-500 cursor-not-allowed'
    if (seat.seatStatus === 'LOCKED') return 'bg-orange-200 text-orange-900 cursor-not-allowed'
    if (seat.seatStatus === 'MAINTENANCE') return 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
    return 'bg-indigo-600 text-white hover:bg-indigo-700'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">POS bán vé nhanh</h1>
          <p className="text-sm text-slate-600 mt-1">Chọn ghế, xác nhận thanh toán và sinh mã order tại quầy.</p>
        </div>
        <select
          value={selectedEventId}
          onChange={(event) => setSelectedEventId(event.target.value)}
          className="min-w-72 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {orderResult && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>
              Đã tạo order <strong>{orderResult.orderCode}</strong> cho ghế{' '}
              {orderResult.items.map((item) => item.seatLabel).join(', ')}.
            </span>
          </div>
          <Badge className="bg-white text-emerald-700 border border-emerald-200">
            {orderResult.paymentStatus}
          </Badge>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-600">
          <Loader2 className="mr-3 h-6 w-6 animate-spin text-indigo-600" />
          Đang tải dữ liệu POS...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            <Card className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <AlertCircle size={18} className="text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Thông tin khách hàng</h2>
                {customerLookup?.found && (
                  <Badge className="ml-2 bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Khách cũ
                  </Badge>
                )}
                {customerLookup && !customerLookup.found && (
                  <Badge className="ml-2 bg-slate-50 text-slate-700 border border-slate-200">
                    Khách mới
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-xs font-medium text-slate-700 mb-2 block">
                    SĐT (bắt buộc)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0909123456"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    className="text-sm bg-indigo-50 border-indigo-200"
                  />
                </div>
                <div>
                  <Label htmlFor="name" className="text-xs font-medium text-slate-700 mb-2 block">
                    Tên khách hàng (bắt buộc)
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className="text-sm bg-indigo-50 border-indigo-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email" className="text-xs font-medium text-slate-700 mb-2 block">
                    Email nhận vé điện tử (tùy chọn)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="customer@example.com"
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    className="text-sm bg-indigo-50 border-indigo-200"
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-white border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Sơ đồ ghế</h2>
                  <p className="text-xs text-slate-500 mt-1">Ghế được chọn đổi màu ngay trên giao diện.</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-indigo-600" /> Trống</span>
                  <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-amber-300" /> Đang chọn</span>
                  <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-orange-200" /> Đang giữ</span>
                  <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-slate-300" /> Đã bán</span>
                </div>
              </div>

              {catalogLoading ? (
                <div className="flex items-center justify-center py-16 text-sm text-slate-600">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" />
                  Đang tải sơ đồ ghế...
                </div>
              ) : seatsByRow.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
                  Sự kiện này chưa có sơ đồ ghế.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="mb-6 rounded-b-full border-b-8 border-indigo-200 py-3 text-center text-xs font-semibold tracking-[0.2em] text-slate-500">
                    SÂN KHẤU
                  </div>
                  <div className="space-y-3 min-w-max">
                    {seatsByRow.map((row) => (
                      <div key={row.row} className="flex items-center gap-3">
                        <span className="w-6 text-sm font-semibold text-slate-500">{row.label}</span>
                        <div className="flex gap-2">
                          {row.seats.map((seat) => (
                            <button
                              key={seat.seatId}
                              type="button"
                              onClick={() => toggleSeat(seat)}
                              disabled={seat.seatStatus !== 'AVAILABLE'}
                              title={`${seat.seatLabel} - ${seat.ticketClassName} - ${formatMoney(Number(seat.price))}`}
                              className={`h-8 w-8 rounded-md text-[11px] font-semibold transition ${getSeatClassName(seat)}`}
                            >
                              {(seat.gridColumn ?? 0) + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-white border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Ticket size={20} className="text-indigo-600" />
                  Đơn hàng
                </h2>
                <Button variant="ghost" size="sm" className="text-indigo-600 text-xs" onClick={clearOrder}>
                  Xóa chọn
                </Button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {selectedSeats.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Chưa chọn ghế.</p>
                ) : (
                  selectedSeats.map((seat) => (
                    <div key={seat.seatId} className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Ghế {seat.seatLabel}</p>
                        <p className="text-xs text-slate-600">{seat.ticketClassName}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{formatMoney(Number(seat.price))}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Tổng cộng</span>
                <span className="text-2xl font-bold text-indigo-600">{formatMoney(totalAmount)}</span>
              </div>
            </Card>

            <Card className="bg-white border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-indigo-600" />
                Thanh toán
              </h2>
              <div className="space-y-3">
                {PAYMENT_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const active = paymentMethod === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => !option.disabled && setPaymentMethod(option.value)}
                      disabled={option.disabled}
                      className={`w-full rounded-lg border-2 p-4 text-left transition ${
                        active ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
                      } ${option.disabled ? 'cursor-not-allowed opacity-55' : ''}`}
                    >
                      <Icon size={22} className="text-indigo-600 mb-2" />
                      <p className="font-semibold text-slate-900">{option.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{option.description}</p>
                    </button>
                  )
                })}
              </div>

              {requiresManualConfirmation && (
                <div className="mt-4">
                  <Label htmlFor="amount" className="text-xs font-medium text-slate-700 mb-2 block">
                    Số tiền staff xác nhận đã nhận
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    min={0}
                    value={amountReceived}
                    onChange={(event) => setAmountReceived(event.target.value)}
                    placeholder={String(totalAmount)}
                    className="text-sm"
                  />
                </div>
              )}
            </Card>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 text-base"
              onClick={handleIssueTickets}
              disabled={submitting || selectedSeatIds.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang tạo order...
                </>
              ) : (
                'Xác nhận và xuất vé'
              )}
            </Button>

            <div className="text-xs text-slate-600 space-y-1 border-t border-slate-200 pt-4">
              <p className="font-semibold text-slate-900">TERMINAL #01</p>
              <p>Mục tiêu xử lý: chọn ghế đến mã order dưới 2 giây.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
