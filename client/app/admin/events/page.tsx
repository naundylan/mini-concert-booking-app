'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { MapPin, Calendar, Eye, Plus, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import EventForm from './components/EventForm'
import { Event, EventCreateDTO, EventUpdateDTO } from '@/lib/types/event.type'
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

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await eventService.getAll()
      setEvents(response.data)
    } catch (error: any) {
      console.error('Failed to fetch events:', error)
      toast({ title: 'Error', description: 'Failed to load events.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event)
    setShowDetailsDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDetailsDialog(false)
    setSelectedEvent(null)
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
        toast({ title: 'Success', description: 'Event created successfully!' })

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
        toast({ title: 'Success', description: 'Event updated successfully!' })
      }

      await fetchEvents()
      setShowFormDialog(false)
      setShowDetailsDialog(false)
      setSelectedEvent(null)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to save event.'
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
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

  const formatDateTime = (isoString: string) => {
    if (!isoString || isoString === 'TBD') return 'TBD'
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', year: 'numeric',
    })
  }

  const filteredEvents =
    statusFilter === 'All Statuses'
      ? events
      : events.filter((e) => e.status === statusFilter)

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <p className="text-xs font-semibold text-indigo-600 tracking-wide uppercase mb-2">Management</p>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Events</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-slate-600">Filter:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="TEASING">TEASING</option>
                <option value="ONSALE">ONSALE</option>
                <option value="ENDED">ENDED</option>
                <option value="CANCELED">CANCELED</option>
              </select>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleOpenCreateForm}>
              <Plus size={16} className="mr-2" />
              Create Event
            </Button>
          </div>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-sm text-slate-600">Loading events...</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-500">No events found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => handleViewDetails(event)}
              className="w-full bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden border-2 border-slate-300">
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
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span className="text-slate-500">START</span>
                    </div>
                    <span className="font-medium text-slate-700">
                      {event.startTime ? formatDateTime(event.startTime) : ''}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Badge className={`text-xs font-semibold border ${getStatusColor(event.status)}`}>
                    {event.status}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Event Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-indigo-600" />
              <div>
                <DialogTitle>Event Details</DialogTitle>
                {selectedEvent && (
                  <Badge className={`mt-2 text-xs font-semibold border ${getStatusColor(selectedEvent.status)}`}>
                    {selectedEvent.status}
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
                  <span className="text-white text-xs font-semibold bg-black/40 px-3 py-1 rounded">PREVIEW ONLY</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Event Name', value: selectedEvent.name },
                  { label: 'Status',     value: selectedEvent.status },
                  { label: 'Start Time', value: selectedEvent.startTime ? formatDateTime(selectedEvent.startTime) : '' },
                  { label: 'End Time',   value: selectedEvent.endTime   ? formatDateTime(selectedEvent.endTime)   : '' },
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
                <label className="text-xs font-semibold text-indigo-600 block mb-1">Location</label>
                <input type="text" value={selectedEvent.location} disabled
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
              </div>
              <div>
                <label className="text-xs font-semibold text-indigo-600 block mb-1">Event Banner URL</label>
                <input type="text" value={selectedEvent.bannerUrl || ''} disabled
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-600 truncate" />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-600">
                  This event is currently in <span className="font-semibold">read-only</span> mode.
                  To make changes, click Edit.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-slate-200 gap-3 mt-4">
            <Button variant="outline" onClick={handleCloseDialog} className="text-slate-700">Cancel</Button>
            <Button className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-medium" onClick={handleOpenEditForm}>
              ✏️ Edit Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Form Dialog */}
      {showFormDialog && (
        <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
          <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{formMode === 'create' ? 'Create New Event' : 'Edit Event'}</DialogTitle>
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