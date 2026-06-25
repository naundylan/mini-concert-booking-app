'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Banknote,
  Calendar,
  Check,
  CreditCard,
  Landmark,
  Loader2,
  MapPin,
  Search,
  Ticket,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { posService } from '@/lib/services/pos.service'
import {
  CustomerLookupDTO,
  OrderItemResponseDTO,
  PaymentMethod,
  PosEvent,
  SeatCatalogDTO,
} from '@/lib/types/pos.type'

const PAYMENT_OPTIONS: Array<{
  value: PaymentMethod
  title: string
  description: string
  icon: React.ElementType
}> = [
  {
    value: 'CASH',
    title: 'Tiền mặt',
    description: 'Nhân viên xác nhận khi đã nhận đủ tiền tại quầy.',
    icon: Banknote,
  },
  {
    value: 'BANK_TRANSFER',
    title: 'Chuyển khoản',
    description: 'Nhân viên kiểm tra app ngân hàng riêng trước khi xác nhận.',
    icon: Landmark,
  },
]

type PosStep = 'ORDER' | 'PAYMENT'

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

const getApiErrorMessage = (err: any) => {
  const body = err?.response?.data
  const fieldErrors = body?.data?.errors
  if (fieldErrors && typeof fieldErrors === 'object') {
    const details = Object.entries(fieldErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('; ')
    return body?.message ? `${body.message}: ${details}` : details
  }
  return body?.message || 'Có lỗi xảy ra. Vui lòng thử lại.'
}

const getSeatId = (seat: OrderItemResponseDTO) => seat.id || seat.seatId
const getSeatLabel = (seat: OrderItemResponseDTO) => seat.label || seat.seatLabel
const getSeatStatus = (seat: OrderItemResponseDTO) => seat.status || seat.seatStatus
const getTicketClassName = (seat: OrderItemResponseDTO) =>
  seat.ticketClass?.name || seat.ticketClassName || 'Hạng vé'
const getTicketClassColor = (seat: OrderItemResponseDTO) => seat.ticketClass?.colorCode || '#4f46e5'
const getSeatPrice = (seat: OrderItemResponseDTO) => Number(seat.ticketClass?.price ?? seat.price ?? 0)

export default function POSPage() {
  const router = useRouter()
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
  const [step, setStep] = useState<PosStep>('ORDER')
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await posService.getEvents()
        setEvents(data)
      } catch (err: any) {
        setError(getApiErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  useEffect(() => {
    if (!selectedEventId) {
      setCatalog(null)
      return
    }

    const loadCatalog = async () => {
      try {
        setCatalogLoading(true)
        setError('')
        const data = await posService.getCatalog(selectedEventId)
        setCatalog(data)
      } catch (err: any) {
        setError(getApiErrorMessage(err))
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

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || null,
    [events, selectedEventId]
  )

  const selectedSeats = useMemo(() => {
    if (!catalog) return []
    return catalog.seats.filter((seat) => selectedSeatIds.includes(getSeatId(seat)))
  }, [catalog, selectedSeatIds])

  const seatsByRow = useMemo(() => {
    if (!catalog) return []
    const rows = new Map<number, OrderItemResponseDTO[]>()
    for (const seat of catalog.seats) {
      const row = seat.gridRow ?? 0
      rows.set(row, [...(rows.get(row) || []), seat])
    }
    return Array.from(rows.entries())
      .sort(([a], [b]) => a - b)
      .map(([row, seats]) => ({
        row,
        label: String.fromCharCode(65 + row),
        seats: seats.sort((a, b) => (a.gridColumn ?? 0) - (b.gridColumn ?? 0)),
      }))
  }, [catalog])

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + getSeatPrice(seat), 0)

  const selectEvent = (eventId: string) => {
    setSelectedEventId(eventId)
    setSelectedSeatIds([])
    setCustomerPhone('')
    setCustomerName('')
    setCustomerEmail('')
    setCustomerLookup(null)
    setPaymentMethod('CASH')
    setAmountReceived('')
    setStep('ORDER')
    setError('')
    setShowEventDialog(false)
  }

  const toggleSeat = (seat: OrderItemResponseDTO) => {
    const seatId = getSeatId(seat)
    if (getSeatStatus(seat) !== 'AVAILABLE') return
    setError('')
    setSelectedSeatIds((current) =>
      current.includes(seatId)
        ? current.filter((id) => id !== seatId)
        : current.length >= 10
          ? current
          : [...current, seatId]
    )
  }

  const validateCustomerAndSeats = () => {
    if (!selectedEventId) return 'Vui lòng chọn sự kiện trước khi bán vé.'
    if (!customerPhone.trim()) return 'SĐT khách hàng là bắt buộc.'
    if (!customerName.trim()) return 'Tên khách hàng là bắt buộc.'
    if (customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      return 'Email khách hàng không hợp lệ.'
    }
    if (selectedSeatIds.length === 0) return 'Vui lòng chọn ít nhất một ghế.'
    if (selectedSeatIds.length > 10) return 'Một đơn hàng chỉ được chọn tối đa 10 ghế.'
    return ''
  }

  const goToPayment = () => {
    const validationError = validateCustomerAndSeats()
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setStep('PAYMENT')
  }

  const confirmPayment = async () => {
    const validationError = validateCustomerAndSeats()
    if (validationError) {
      setError(validationError)
      setStep('ORDER')
      return
    }

    const received = Number(amountReceived)
    if (!amountReceived || Number.isNaN(received) || received < totalAmount) {
      setError('Số tiền đã nhận phải lớn hơn hoặc bằng tổng tiền đơn hàng.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      const response = await posService.createOrder({
        eventId: selectedEventId,
        phone: customerPhone.trim(),
        fullName: customerName.trim(),
        email: customerEmail.trim() || undefined,
        seatIds: selectedSeatIds,
        payment: {
          paymentMethod,
          amountReceived: received,
        },
      })
      router.push(`/staff/pos/success?orderCode=${encodeURIComponent(response.orderCode)}`)
    } catch (err: any) {
      setError(getApiErrorMessage(err))
      if (selectedEventId) {
        try {
          setCatalog(await posService.getCatalog(selectedEventId))
        } catch {
          // Keep the original submit error visible.
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const getSeatClassName = (seat: OrderItemResponseDTO) => {
    const status = getSeatStatus(seat)
    const isSelected = selectedSeatIds.includes(getSeatId(seat))
    if (isSelected) return 'bg-amber-300 text-slate-950 ring-2 ring-amber-500'
    if (status === 'SOLD') return 'bg-slate-300 text-slate-500 cursor-not-allowed'
    if (status === 'LOCKED') return 'bg-orange-200 text-orange-900 cursor-not-allowed'
    if (status === 'MAINTENANCE') return 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
    return 'text-white hover:brightness-95'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">POS bán vé tại quầy</h1>
          <p className="mt-1 text-sm text-slate-600">
            Chọn sự kiện, chọn ghế, xác nhận thanh toán và xuất vé cho khách.
          </p>
        </div>
        {selectedEvent && (
          <Button variant="outline" onClick={() => setShowEventDialog(true)}>
            Đổi sự kiện
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="border border-slate-200 bg-white p-5">
        {selectedEvent ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-indigo-50">
                {selectedEvent.bannerUrl ? (
                  <img src={selectedEvent.bannerUrl} alt={selectedEvent.name} className="h-full w-full object-cover" />
                ) : (
                  <Calendar className="text-indigo-600" size={28} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{selectedEvent.name}</h2>
                  <Badge className={`border ${selectedEvent.status === 'ONSALE' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-violet-200 bg-violet-50 text-violet-700'}`}>
                    {selectedEvent.status === 'ONSALE' ? 'Đang mở bán' : selectedEvent.status === 'TEASING' ? 'Sắp mở bán' : selectedEvent.status}
                  </Badge>
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                  <MapPin size={14} /> {selectedEvent.location}
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                  <Calendar size={14} /> {formatDateTime(selectedEvent.startTime)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">
              <Ticket size={18} />
              {selectedSeats.length} ghế đang chọn
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Search size={30} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Chọn sự kiện để bán vé</h2>
              <p className="mt-1 text-sm text-slate-600">
                Nhân viên cần chọn sự kiện đang mở bán trước khi nhập khách hàng và chọn ghế.
              </p>
            </div>
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => setShowEventDialog(true)}>
              Chọn sự kiện
            </Button>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-600">
          <Loader2 className="mr-3 h-6 w-6 animate-spin text-indigo-600" />
          Đang tải dữ liệu POS...
        </div>
      ) : selectedEvent ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {step === 'ORDER' ? (
              <>
                <Card className="border border-slate-200 bg-white p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <AlertCircle size={18} className="text-indigo-600" />
                    <h2 className="text-lg font-bold text-slate-900">Thông tin khách hàng</h2>
                    {customerLookup?.found && (
                      <Badge className="ml-2 border border-indigo-200 bg-indigo-50 text-indigo-700">
                        Khách cũ
                      </Badge>
                    )}
                    {customerLookup && !customerLookup.found && (
                      <Badge className="ml-2 border border-slate-200 bg-slate-50 text-slate-700">
                        Khách mới
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="phone" className="mb-2 block text-xs font-medium text-slate-700">
                        SĐT bắt buộc
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="0909123456"
                        value={customerPhone}
                        onChange={(event) => setCustomerPhone(event.target.value)}
                        className="bg-indigo-50 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name" className="mb-2 block text-xs font-medium text-slate-700">
                        Tên khách hàng bắt buộc
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        className="bg-indigo-50 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="email" className="mb-2 block text-xs font-medium text-slate-700">
                        Email nhận vé điện tử tùy chọn
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="customer@example.com"
                        value={customerEmail}
                        onChange={(event) => setCustomerEmail(event.target.value)}
                        className="bg-indigo-50 text-sm"
                      />
                    </div>
                  </div>
                </Card>

                <Card className="border border-slate-200 bg-white p-6">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Sơ đồ ghế</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Ghế được chọn đổi màu ngay; trạng thái cuối cùng được xác nhận bởi backend.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-indigo-600" /> Trống</span>
                      <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-amber-300" /> Đang chọn</span>
                      <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-orange-200" /> Đang giữ</span>
                      <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-slate-300" /> Đã bán</span>
                      <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-zinc-200" /> Bảo trì</span>
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
                      <div className="min-w-max space-y-3">
                        {seatsByRow.map((row) => (
                          <div key={row.row} className="flex items-center gap-3">
                            <span className="w-6 text-sm font-semibold text-slate-500">{row.label}</span>
                            <div className="flex gap-2">
                              {row.seats.map((seat) => (
                                <button
                                  key={getSeatId(seat)}
                                  type="button"
                                  onClick={() => toggleSeat(seat)}
                                  disabled={getSeatStatus(seat) !== 'AVAILABLE'}
                                  title={`${getSeatLabel(seat)} - ${getTicketClassName(seat)} - ${formatMoney(getSeatPrice(seat))}`}
                                  style={getSeatStatus(seat) === 'AVAILABLE' && !selectedSeatIds.includes(getSeatId(seat)) ? { backgroundColor: getTicketClassColor(seat) } : undefined}
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
              </>
            ) : (
              <Card className="border border-slate-200 bg-white p-6">
                <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <CreditCard size={20} className="text-indigo-600" />
                  Xác nhận thanh toán
                </h2>
                <p className="mb-6 text-sm text-slate-600">
                  Chỉ bấm nút cuối sau khi khách đã thanh toán và staff đã kiểm tra đủ tiền.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  {PAYMENT_OPTIONS.map((option) => {
                    const Icon = option.icon
                    const active = paymentMethod === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPaymentMethod(option.value)}
                        className={`rounded-lg border-2 p-4 text-left transition ${
                          active ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <Icon size={22} className="mb-2 text-indigo-600" />
                        <p className="font-semibold text-slate-900">{option.title}</p>
                        <p className="mt-1 text-xs text-slate-600">{option.description}</p>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6">
                  <Label htmlFor="amount" className="mb-2 block text-xs font-medium text-slate-700">
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
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Ticket size={20} className="text-indigo-600" />
                  Đơn tạm tính
                </h2>
                {step === 'ORDER' && (
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-600" onClick={() => setSelectedSeatIds([])}>
                    Xóa chọn
                  </Button>
                )}
              </div>

              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {selectedSeats.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Chưa chọn ghế.</p>
                ) : (
                  selectedSeats.map((seat) => (
                    <div key={getSeatId(seat)} className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Ghế {getSeatLabel(seat)}</p>
                        <p className="text-xs text-slate-600">{getTicketClassName(seat)}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{formatMoney(getSeatPrice(seat))}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-sm font-medium text-slate-600">Tổng cộng</span>
                <span className="text-2xl font-bold text-indigo-600">{formatMoney(totalAmount)}</span>
              </div>
            </Card>

            {step === 'ORDER' ? (
              <Button
                className="w-full bg-indigo-600 py-3 text-base font-semibold text-white hover:bg-indigo-700"
                onClick={goToPayment}
                disabled={selectedSeatIds.length === 0}
              >
                Chuyển sang thanh toán
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full bg-indigo-600 py-3 text-base font-semibold text-white hover:bg-indigo-700"
                  onClick={confirmPayment}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Đang tạo đơn...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Đã nhận được tiền
                    </>
                  )}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setStep('ORDER')} disabled={submitting}>
                  Quay lại chọn ghế
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chọn sự kiện đang mở bán</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-600">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" />
              Đang tải sự kiện...
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
              Không có sự kiện nào đang mở bán.
            </div>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => selectEvent(event.id)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                      {event.bannerUrl ? (
                        <img src={event.bannerUrl} alt={event.name} className="h-full w-full object-cover" />
                      ) : (
                        <Calendar className="text-slate-400" size={24} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-slate-900">{event.name}</h3>
                        <Badge className={`border ${event.status === 'ONSALE' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-violet-200 bg-violet-50 text-violet-700'}`}>
                          {event.status === 'ONSALE' ? 'Đang mở bán' : event.status === 'TEASING' ? 'Sắp mở bán' : event.status}
                        </Badge>
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                        <MapPin size={14} /> {event.location}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
                        <Calendar size={14} /> {formatDateTime(event.startTime)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
