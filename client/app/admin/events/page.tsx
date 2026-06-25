'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { MapPin, Calendar, Eye, Plus, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import EventForm from './components/EventForm'
import { Event, EventCreateDTO, EventUpdateDTO, TicketClass } from '@/lib/types/event.type'
import { eventService } from '@/lib/services/event.service'

// ✅ Fix timezone: giữ nguyên giờ local khi gửi lên API
const toISOWithOffset = (localStr: string): string | null => {
  if (!localStr) return null
  const date = new Date(localStr)
  if (isNaN(date.getTime())) return null
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00${sign}${pad(offset / 60)}:${pad(offset % 60)}`
}

// ✅ Fix timezone: hiển thị giờ local khi mở form edit
const toDateTimeLocal = (isoString: string | null | undefined): string => {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [ticketClasses, setTicketClasses] = useState<TicketClass[]>([])
  const [ticketClassForm, setTicketClassForm] = useState({ name: '', colorCode: '#4f46e5', price: '' })

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await eventService.getAll()
      setEvents(response.data)
    } catch (error: any) {
      console.error('Failed to fetch events:', error)
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách sự kiện.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  const loadCatalog = async (eventId: string) => {
    try {
      setCatalogLoading(true)
      const classesResponse = await eventService.adminGetTicketClasses(eventId)
      setTicketClasses(classesResponse.data)
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.response?.data?.message || 'Không thể tải hạng vé và ghế ngồi.',
        variant: 'destructive',
      })
    } finally {
      setCatalogLoading(false)
    }
  }

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event)
    setShowDetailsDialog(true)
    setTicketClassForm({ name: '', colorCode: '#4f46e5', price: '' })
    loadCatalog(event.id)
  }

  const handleCloseDialog = () => {
    setShowDetailsDialog(false)
    setSelectedEvent(null)
    setTicketClasses([])
  }

  const handleCreateTicketClass = async () => {
    if (!selectedEvent) return
    if (!ticketClassForm.name.trim() || !ticketClassForm.price) {
      toast({ title: 'Lỗi', description: 'Tên hạng vé và giá tiền là bắt buộc.', variant: 'destructive' })
      return
    }

    try {
      setSubmitting(true)
      await eventService.adminCreateTicketClass(selectedEvent.id, {
        name: ticketClassForm.name.trim(),
        colorCode: ticketClassForm.colorCode || null,
        price: Number(ticketClassForm.price),
      })
      setTicketClassForm({ name: '', colorCode: '#4f46e5', price: '' })
      await loadCatalog(selectedEvent.id)
      toast({ title: 'Thành công', description: 'Hạng vé đã được tạo thành công!' })
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error?.response?.data?.message || 'Không thể tạo hạng vé.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenCreateForm = () => {
    setFormMode('create')
    setShowFormDialog(true)
  }

  const handleOpenEditForm = () => {
    setFormMode('edit')
    setShowDetailsDialog(false)
    setShowFormDialog(true)
  }

  const handleFormSubmit = async (data: any) => {
    try {
      setSubmitting(true)

      if (formMode === 'create') {
        const apiData: EventCreateDTO = {
          name:        data.name,
          location:    data.location,
          bannerUrl:   data.bannerUrl || null,
          teasingTime: toISOWithOffset(data.teasingTime), // ✅ giữ đúng giờ local
          openTime:    toISOWithOffset(data.openTime),
          startTime:   toISOWithOffset(data.startTime),
          endTime:     toISOWithOffset(data.endTime),
        }
        await eventService.create(apiData)
        toast({ title: 'Thành công', description: 'Sự kiện đã được tạo thành công!' })

      } else if (formMode === 'edit' && selectedEvent) {
        const currentStatus = selectedEvent.status
        let apiData: EventUpdateDTO = {}

        if (currentStatus === 'DRAFT') {
          apiData = {
            name:        data.name,
            location:    data.location,
            bannerUrl:   data.bannerUrl || null,
            teasingTime: toISOWithOffset(data.teasingTime), // ✅
            openTime:    toISOWithOffset(data.openTime),
            startTime:   toISOWithOffset(data.startTime),
            endTime:     toISOWithOffset(data.endTime),
            status:      data.status || undefined,
          }
        } else if (currentStatus === 'TEASING') {
          apiData = {
            name:      data.name,
            location:  data.location,
            bannerUrl: data.bannerUrl || null,
            status:    data.status === 'CANCELED' ? 'CANCELED' : undefined,
          }
        } else if (currentStatus === 'ONSALE') {
          apiData = { status: 'CANCELED' }
        }

        await eventService.update(selectedEvent.id, apiData)
        toast({ title: 'Thành công', description: 'Cập nhật sự kiện thành công!' })
      }

      await fetchEvents()
      setShowFormDialog(false)
      setShowDetailsDialog(false)
      setSelectedEvent(null)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Không thể lưu sự kiện.'
      toast({ title: 'Lỗi', description: errorMessage, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleFormCancel = () => {
    setShowFormDialog(false)
    if (formMode === 'edit' && selectedEvent) {
      setShowDetailsDialog(true)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONSALE':   return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'TEASING':  return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'CANCELED': return 'bg-red-100 text-red-800 border-red-300'
      case 'DRAFT':    return 'bg-slate-100 text-slate-800 border-slate-300'
      case 'ENDED':    return 'bg-gray-100 text-gray-800 border-gray-300'
      default:         return 'bg-slate-100 text-slate-800'
    }
  }

  const translateStatus = (status: string) => {
    switch (status) {
      case 'ONSALE':   return 'Đang mở bán'
      case 'TEASING':  return 'Sắp mở bán'
      case 'CANCELED': return 'Đã hủy'
      case 'DRAFT':    return 'Bản nháp'
      case 'ENDED':    return 'Đã kết thúc'
      default:         return status
    }
  }

  const formatDateTime = (isoString: string) => {
    if (!isoString || isoString === 'TBD') return 'TBD'
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString
    return date.toLocaleString('vi-VN', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', year: 'numeric',
    })
  }

  const formatMoney = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)

  const filteredEvents =
    statusFilter === 'All Statuses'
      ? events
      : events.filter((e) => e.status === statusFilter)

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <p className="text-xs font-semibold text-indigo-600 tracking-wide uppercase mb-2">Quản lý</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Sự kiện</h1>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-slate-600">Bộ lọc:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-auto"
              >
                <option value="All Statuses">Tất cả trạng thái</option>
                <option value="DRAFT">Bản nháp (DRAFT)</option>
                <option value="TEASING">Sắp mở bán (TEASING)</option>
                <option value="ONSALE">Đang mở bán (ONSALE)</option>
                <option value="ENDED">Đã kết thúc (ENDED)</option>
                <option value="CANCELED">Đã hủy (CANCELED)</option>
              </select>
            </div>
            <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-700 sm:w-auto" onClick={handleOpenCreateForm}>
              <Plus size={16} className="mr-2" />
              Tạo sự kiện
            </Button>
          </div>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-sm text-slate-600">Đang tải sự kiện...</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-500">Không tìm thấy sự kiện nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => handleViewDetails(event)}
              className="w-full bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-slate-300 bg-slate-200">
                    {event.bannerUrl ? (
                      <img
                        src={event.bannerUrl}
                        alt={event.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Calendar size={24} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                    {event.name}
                  </h3>
                  <div className="mt-2 flex flex-col gap-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span className="text-slate-500">BẮT ĐẦU</span>
                    </div>
                    <span className="font-medium text-slate-700">
                      {event.startTime ? formatDateTime(event.startTime) : ''}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Badge className={`text-xs font-semibold border ${getStatusColor(event.status)}`}>
                    {translateStatus(event.status)}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Event Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl">
          <DialogHeader className="pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-indigo-600" />
              <div>
                <DialogTitle>Chi tiết sự kiện</DialogTitle>
                {selectedEvent && (
                  <Badge className={`mt-2 text-xs font-semibold border ${getStatusColor(selectedEvent.status)}`}>
                    {translateStatus(selectedEvent.status)}
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              <div className="relative w-full h-36 rounded-lg overflow-hidden bg-slate-200 mb-4">
                <img
                  src={selectedEvent.bannerUrl || ''}
                  alt={selectedEvent.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="text-white text-xs font-semibold bg-black/40 px-3 py-1 rounded">CHỈ XEM TRƯỚC</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { label: 'Tên sự kiện', value: selectedEvent.name },
                  { label: 'Trạng thái',     value: translateStatus(selectedEvent.status) },
                  { label: 'Thời gian bắt đầu', value: selectedEvent.startTime ? formatDateTime(selectedEvent.startTime) : '' },
                  { label: 'Thời gian kết thúc',   value: selectedEvent.endTime   ? formatDateTime(selectedEvent.endTime)   : '' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <label className="text-xs font-semibold text-indigo-600 block mb-1">{label}</label>
                    <input
                      type="text" value={value} disabled
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-indigo-600 block mb-1">Địa điểm</label>
                <input type="text" value={selectedEvent.location} disabled
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
              </div>
              <div>
                <label className="text-xs font-semibold text-indigo-600 block mb-1">Đường dẫn ảnh bìa (Banner URL)</label>
                <input type="text" value={selectedEvent.bannerUrl || ''} disabled
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-600 truncate" />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-600">
                  Sự kiện này hiện ở chế độ <span className="font-semibold">chỉ xem</span>.
                  Để chỉnh sửa thông tin, vui lòng bấm nút Chỉnh sửa.
                </p>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Các hạng vé</h3>
                  {catalogLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                </div>
                <div className="space-y-2 mb-4">
                  {ticketClasses.length === 0 ? (
                    <p className="text-xs text-slate-500 rounded-lg border border-dashed border-slate-200 p-3">
                      Chưa có hạng vé nào.
                    </p>
                  ) : (
                    ticketClasses.map((ticketClass) => (
                      <div key={ticketClass.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded"
                            style={{ backgroundColor: ticketClass.colorCode || '#4f46e5' }}
                          />
                          <span className="text-sm font-medium text-slate-900">{ticketClass.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-indigo-600">
                          {formatMoney(Number(ticketClass.price))}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_110px_130px_auto]">
                  <input
                    type="text"
                    placeholder="Tên hạng vé (Ví dụ: VIP)"
                    value={ticketClassForm.name}
                    onChange={(event) => setTicketClassForm((current) => ({ ...current, name: event.target.value }))}
                    className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                    disabled={selectedEvent.status !== 'DRAFT'}
                  />
                  <input
                    type="color"
                    value={ticketClassForm.colorCode}
                    onChange={(event) => setTicketClassForm((current) => ({ ...current, colorCode: event.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2"
                    disabled={selectedEvent.status !== 'DRAFT'}
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Giá vé (Ví dụ: 500000)"
                    value={ticketClassForm.price}
                    onChange={(event) => setTicketClassForm((current) => ({ ...current, price: event.target.value }))}
                    className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                    disabled={selectedEvent.status !== 'DRAFT'}
                  />
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleCreateTicketClass}
                    disabled={submitting || selectedEvent.status !== 'DRAFT'}
                  >
                    Thêm
                  </Button>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Sơ đồ ghế ngồi</h3>
                <p className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-800">
                  Ghế ngồi được tạo bằng cách áp dụng một sơ đồ ghế đã xuất bản từ màn hình Sơ đồ ghế. Hạng vé có thể được tạo ở đây, hoặc tạo trực tiếp khi liên kết sơ đồ ghế với sự kiện.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-slate-200 gap-3 mt-4">
            <Button variant="outline" onClick={handleCloseDialog} className="text-slate-700">Hủy</Button>
            <Button className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-medium" onClick={handleOpenEditForm}>
              ✏️ Sửa sự kiện
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Form Dialog */}
      {showFormDialog && (
        <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
          <DialogContent className="max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{formMode === 'create' ? 'Tạo sự kiện mới' : 'Chỉnh sửa sự kiện'}</DialogTitle>
            </DialogHeader>
            <EventForm
              mode={formMode}
              initialData={
                formMode === 'edit' && selectedEvent
                  ? {
                      name:        selectedEvent.name,
                      location:    selectedEvent.location,
                      bannerUrl:   selectedEvent.bannerUrl || undefined,
                      teasingTime: toDateTimeLocal(selectedEvent.teasingTime), // ✅ giờ local
                      openTime:    toDateTimeLocal(selectedEvent.openTime),
                      startTime:   toDateTimeLocal(selectedEvent.startTime),
                      endTime:     toDateTimeLocal(selectedEvent.endTime),
                      status:      selectedEvent.status,
                    }
                  : undefined
              }
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
