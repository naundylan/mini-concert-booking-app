'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser'
import {
  AlertTriangle,
  Calendar,
  Camera,
  CheckCircle2,
  Loader2,
  MapPin,
  QrCode,
  Search,
  StopCircle,
  Ticket,
  User,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { checkInService } from '@/lib/services/check-in.service'
import {
  CheckInEvent,
  CheckInOrder,
  CheckInResponse,
  CheckInResultStatus,
  CheckInTicket,
} from '@/lib/types/check-in.type'

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Chưa có'
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
    return Object.values(fieldErrors).join('; ')
  }
  return body?.message || 'Có lỗi xảy ra. Vui lòng thử lại.'
}

const getTicketLabel = (ticket?: CheckInTicket | null) => ticket?.label || ticket?.seatLabel || 'Chưa rõ ghế'
const getTicketClassName = (ticket?: CheckInTicket | null) => ticket?.ticketClassName || 'Hạng vé'

const getEventCheckInBadge = (event: CheckInEvent) =>
  event.status === 'ENDED'
    ? { label: 'Đang diễn ra / check-in', className: 'bg-amber-100 text-amber-700' }
    : { label: 'Đang bán / có thể check-in', className: 'bg-green-100 text-green-700' }

const extractTicketId = (rawValue: string) => {
  const uuid = rawValue.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  return uuid?.[0] || rawValue.trim()
}

const getPanelStyle = (result?: CheckInResultStatus) => {
  if (result === 'ACCEPTED') {
    return {
      icon: CheckCircle2,
      title: 'Cho vào cổng',
      className: 'border-green-200 bg-green-50 text-green-800',
    }
  }
  if (result === 'ALREADY_USED') {
    return {
      icon: XCircle,
      title: 'Vé đã sử dụng',
      className: 'border-red-300 bg-red-600 text-white',
    }
  }
  return {
    icon: AlertTriangle,
    title: 'Vé không hợp lệ',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  }
}

export default function CheckInPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const lastScannedValueRef = useRef('')

  const [events, setEvents] = useState<CheckInEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [orders, setOrders] = useState<CheckInOrder[]>([])
  const [scanResult, setScanResult] = useState<CheckInResponse | null>(null)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [checkingTicketId, setCheckingTicketId] = useState('')
  const [scannerActive, setScannerActive] = useState(false)
  const [scannerError, setScannerError] = useState('')
  const [error, setError] = useState('')

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || null,
    [events, selectedEventId]
  )
  const selectedEventBadge = selectedEvent ? getEventCheckInBadge(selectedEvent) : null

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setEventsLoading(true)
        setError('')
        const data = await checkInService.getEvents()
        setEvents(data)
        if (data.length === 1) {
          setSelectedEventId(data[0].id)
        }
      } catch (err: any) {
        setError(getApiErrorMessage(err))
      } finally {
        setEventsLoading(false)
      }
    }

    loadEvents()
  }, [])

  useEffect(() => {
    return () => {
      controlsRef.current?.stop()
    }
  }, [])

  const resetEventState = (eventId: string) => {
    setSelectedEventId(eventId)
    setSearchInput('')
    setOrders([])
    setScanResult(null)
    setError('')
    setScannerError('')
    lastScannedValueRef.current = ''
  }

  const runSearch = async () => {
    if (!selectedEventId) {
      setError('Vui lòng chọn sự kiện trước khi tìm vé.')
      return
    }
    if (!searchInput.trim()) {
      setError('Vui lòng nhập Booking ID hoặc SĐT.')
      return
    }

    try {
      setSearching(true)
      setError('')
      const data = await checkInService.search(selectedEventId, searchInput.trim())
      setOrders(data)
    } catch (err: any) {
      setOrders([])
      setError(getApiErrorMessage(err))
    } finally {
      setSearching(false)
    }
  }

  const checkInTicket = async (ticketId: string) => {
    if (!selectedEventId) {
      setScanResult({
        result: 'ERROR',
        message: 'Vui lòng chọn sự kiện trước khi check-in.',
        orderId: '',
        orderCode: '',
        eventId: '',
        customerId: '',
      })
      return
    }

    try {
      setCheckingTicketId(ticketId)
      setError('')
      const response = await checkInService.checkInTicket(ticketId, selectedEventId)
      const displayedResponse =
        response.result === 'ACCEPTED'
          ? {
              ...response,
              checkedAt: new Date().toISOString(),
            }
          : response
      setScanResult(displayedResponse)
      setOrders((current) =>
        current.map((order) =>
          order.orderId === response.orderId && response.ticket
            ? {
                ...order,
                tickets: order.tickets.map((ticket) =>
                  ticket.ticketId === response.ticket?.ticketId ? response.ticket : ticket
                ),
              }
            : order
        )
      )
    } catch (err: any) {
      setScanResult({
        result: 'ERROR',
        message: getApiErrorMessage(err),
        orderId: '',
        orderCode: '',
        eventId: selectedEventId,
        customerId: '',
      })
    } finally {
      setCheckingTicketId('')
    }
  }

  const startScanner = async () => {
    if (!selectedEventId) {
      setScannerError('Vui lòng chọn sự kiện trước khi bật camera.')
      return
    }
    if (!videoRef.current) return

    try {
      setScannerError('')
      const reader = new BrowserMultiFormatReader()
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices()
      
      const backCamera = videoInputDevices.find((device) => {
        const label = device.label.toLowerCase()
        return (
          label.includes('back') ||
          label.includes('sau') ||
          label.includes('environment') ||
          label.includes('rear')
        )
      })
      
      const deviceId = backCamera
        ? backCamera.deviceId
        : videoInputDevices.length > 0
        ? videoInputDevices[videoInputDevices.length - 1].deviceId
        : undefined

      controlsRef.current = await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result) => {
          const rawValue = result?.getText()
          if (!rawValue || rawValue === lastScannedValueRef.current) return
          lastScannedValueRef.current = rawValue
          
          setTimeout(() => {
            if (lastScannedValueRef.current === rawValue) {
              lastScannedValueRef.current = ''
            }
          }, 3000)

          void checkInTicket(extractTicketId(rawValue))
        }
      )
      setScannerActive(true)
    } catch (err: any) {
      setScannerError(err?.message || 'Không thể mở camera trên thiết bị này.')
      setScannerActive(false)
    }
  }

  const stopScanner = () => {
    controlsRef.current?.stop()
    controlsRef.current = null
    setScannerActive(false)
  }

  const clearCurrentGuest = () => {
    setScanResult(null)
    lastScannedValueRef.current = ''
  }

  const renderRecentPanel = () => {
    if (!scanResult) {
      return (
        <div className="flex min-h-80 flex-col items-center justify-center p-6 text-center">
          <QrCode size={36} className="text-slate-300" />
          <h2 className="mt-4 text-lg font-bold text-slate-900">Recent Scan</h2>
          <p className="mt-2 text-sm text-slate-500">Đang chờ quét vé hoặc check-in thủ công.</p>
        </div>
      )
    }

    const panel = getPanelStyle(scanResult.result)
    const StatusIcon = panel.icon
    const ticket = scanResult.ticket

    return (
      <div className="p-5">
        <div className={`rounded-lg border p-4 ${panel.className}`}>
          <div className="flex items-center gap-2">
            <StatusIcon size={22} />
            <h2 className="text-lg font-bold">{panel.title}</h2>
          </div>
          <p className="mt-1 text-sm opacity-90">{scanResult.message}</p>
        </div>

        <div className="mt-5 space-y-4">
          {scanResult.customerName && (
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Khách hàng</p>
              <p className="text-base font-semibold text-slate-900">{scanResult.customerName}</p>
            </div>
          )}

          {scanResult.orderCode && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Booking ID</p>
                <p className="text-sm font-semibold text-slate-900">{scanResult.orderCode}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  {scanResult.result === 'ALREADY_USED' ? 'Lần trước' : 'Check-in'}
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatDateTime(
                    scanResult.result === 'ALREADY_USED' ? ticket?.checkInTime : scanResult.checkedAt
                  )}
                </p>
              </div>
            </div>
          )}

          {scanResult.result === 'ALREADY_USED' && (
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Nhân viên trước đó</p>
              <p className="text-sm font-semibold text-slate-900">
                {scanResult.checkInByName || ticket?.checkInByName || 'Không rõ'}
              </p>
            </div>
          )}

          {ticket && (
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Ghế</p>
              <div className="mt-2 rounded-lg bg-indigo-600 px-4 py-3 text-white">
                <p className="text-sm font-semibold">{getTicketClassName(ticket)}</p>
                <p className="mt-1 text-xs">{getTicketLabel(ticket)}</p>
              </div>
            </div>
          )}

          <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={clearCurrentGuest}>
            Khách tiếp theo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Check-in vé điện tử</h1>
          <p className="mt-1 text-sm text-slate-600">Quét QR hoặc tìm Booking ID/SĐT để soát vé vào cổng.</p>
        </div>
        <div className="w-full lg:w-80">
          <Label htmlFor="event-select" className="mb-2 block text-xs font-medium text-slate-700">
            Sự kiện check-in
          </Label>
          <select
            id="event-select"
            value={selectedEventId}
            onChange={(event) => resetEventState(event.target.value)}
            disabled={eventsLoading}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">{eventsLoading ? 'Đang tải sự kiện...' : 'Chọn sự kiện'}</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {selectedEvent && (
        <Card className="border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-indigo-50">
                {selectedEvent.bannerUrl ? (
                  <img src={selectedEvent.bannerUrl} alt={selectedEvent.name} className="h-full w-full object-cover" />
                ) : (
                  <Calendar className="text-indigo-600" size={24} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{selectedEvent.name}</h2>
                  {selectedEventBadge && (
                    <Badge className={selectedEventBadge.className}>{selectedEventBadge.label}</Badge>
                  )}
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={13} />
                  {selectedEvent.location}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600">{formatDateTime(selectedEvent.startTime)}</p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
        <div className="space-y-6">
          <Card className="overflow-hidden border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5">
              <Label htmlFor="search-booking" className="mb-2 block text-xs font-medium text-slate-700">
                Tìm theo Booking ID hoặc SĐT
              </Label>
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="search-booking"
                    type="text"
                    placeholder="VD: ORD8829 hoặc 0123456789"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void runSearch()
                    }}
                    className="pl-9 text-sm"
                    disabled={!selectedEventId}
                  />
                </div>
                <Button onClick={runSearch} disabled={!selectedEventId || searching}>
                  {searching ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Search size={16} className="mr-2" />}
                  Tìm vé
                </Button>
              </div>
            </div>

            <div className="relative aspect-video bg-slate-950">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              {!scannerActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-center text-white">
                  <QrCode size={42} className="text-indigo-300" />
                  <p className="mt-3 text-sm font-semibold">Camera quét QR</p>
                  <p className="mt-1 text-xs text-slate-400">Chọn sự kiện rồi bật camera để scan ticketId.</p>
                </div>
              )}
              <div className="pointer-events-none absolute inset-8 border-2 border-indigo-400 opacity-70" />
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-600">
                {scannerError || (scannerActive ? 'Camera đang hoạt động.' : 'Camera đang tắt.')}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={startScanner} disabled={!selectedEventId || scannerActive}>
                  <Camera size={16} className="mr-2" />
                  Bật camera
                </Button>
                <Button variant="outline" onClick={stopScanner} disabled={!scannerActive}>
                  <StopCircle size={16} className="mr-2" />
                  Tắt camera
                </Button>
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-900">Kết quả tìm kiếm</h2>
              <p className="mt-1 text-sm text-slate-500">Check-in từng vé trong đơn hàng.</p>
            </div>
            <div className="p-5">
              {orders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  Chưa có kết quả tìm kiếm.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.orderId} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{order.orderCode}</p>
                          <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                            <User size={14} />
                            {order.customerName || 'Không rõ khách'} {order.phone ? `- ${order.phone}` : ''}
                          </p>
                        </div>
                        <Badge className="bg-slate-100 text-slate-700">{order.tickets.length} vé</Badge>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {order.tickets.map((ticket) => (
                          <div key={ticket.ticketId} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{getTicketClassName(ticket)}</p>
                              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                <Ticket size={13} />
                                {getTicketLabel(ticket)}
                              </p>
                              {ticket.status === 'USED' && (
                                <p className="mt-1 text-xs text-red-600">Đã dùng: {formatDateTime(ticket.checkInTime)}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant={ticket.status === 'UNUSED' ? 'default' : 'outline'}
                              onClick={() => checkInTicket(ticket.ticketId)}
                              disabled={checkingTicketId === ticket.ticketId || ticket.status === 'CANCELED'}
                              className={ticket.status === 'UNUSED' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                            >
                              {checkingTicketId === ticket.ticketId && <Loader2 size={14} className="mr-2 animate-spin" />}
                              {ticket.status === 'UNUSED' ? 'Check-in' : ticket.status === 'USED' ? 'Kiểm tra' : 'Đã hủy'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <Card className="min-h-96 border border-slate-200 bg-white">{renderRecentPanel()}</Card>
        </aside>
      </div>
    </div>
  )
}
