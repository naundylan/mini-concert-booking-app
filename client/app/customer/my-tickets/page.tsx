'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Search, Download, Share2, ChevronRight } from 'lucide-react'

// Mock ticket data
const TICKETS_DATA = [
  {
    id: 'TK-001',
    eventName: 'Neon Velvet Nights',
    eventDate: 'Oct 24, 2024',
    eventTime: '9:00 PM - 3:00 AM',
    venue: 'The Onyx Atrium, NYC',
    seatLocation: 'Sec A, Row 14, Col B2',
    ticketType: 'VIP Access',
    price: '$180.00',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TK-001',
    status: 'UPCOMING',
    bookingDate: 'Oct 20, 2024',
  },
  {
    id: 'TK-002',
    eventName: 'Jazz in the Park',
    eventDate: 'Sep 15, 2024',
    eventTime: '6:00 PM',
    venue: 'Central Park, Denver',
    seatLocation: 'General Admission',
    ticketType: 'Standard Entry',
    price: '$45.00',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TK-002',
    status: 'COMPLETED',
    bookingDate: 'Sep 10, 2024',
  },
  {
    id: 'TK-003',
    eventName: 'Tech Summit 2024',
    eventDate: 'Nov 5, 2024',
    eventTime: '8:00 AM',
    venue: 'Convention Center, SF',
    seatLocation: 'VIP Section',
    ticketType: 'Premium Pass',
    price: '$299.00',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TK-003',
    status: 'UPCOMING',
    bookingDate: 'Oct 18, 2024',
  },
  {
    id: 'TK-004',
    eventName: 'Indie Music Festival',
    eventDate: 'Aug 20, 2024',
    eventTime: '4:00 PM',
    venue: 'Riverside Amphitheater, Austin',
    seatLocation: 'GA Pit',
    ticketType: 'General Admission',
    price: '$75.00',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TK-004',
    status: 'COMPLETED',
    bookingDate: 'Aug 15, 2024',
  },
]

type Ticket = typeof TICKETS_DATA[0]

export default function MyTicketsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('date-desc')

  const filteredAndSortedTickets = useMemo(() => {
    let filtered = TICKETS_DATA.filter((ticket) => {
      const matchesSearch =
        ticket.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter
      return matchesSearch && matchesStatus
    })

    // Sort tickets
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
        case 'date-asc':
          return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
        case 'price-high':
          return parseFloat(b.price.replace('$', '')) - parseFloat(a.price.replace('$', ''))
        case 'price-low':
          return parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', ''))
        default:
          return 0
      }
    })

    return filtered
  }, [searchQuery, statusFilter, sortBy])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Tickets</h1>
        <p className="text-slate-600 text-sm">View and manage your event tickets</p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search event name or ticket ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Tickets</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="COMPLETED">Past</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Grid */}
      {filteredAndSortedTickets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAndSortedTickets.map((ticket) => (
            <Card key={ticket.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                {/* QR Code */}
                <div className="flex-shrink-0">
                  <img
                    src={ticket.qrCode}
                    alt="Ticket QR Code"
                    className="w-24 h-24 rounded-lg bg-slate-100"
                  />
                </div>

                {/* Ticket Info */}
                <div className="flex-1 space-y-3">
                  {/* Header with Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{ticket.eventName}</h3>
                      <p className="text-xs text-slate-500">Booking ID: {ticket.id}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        ticket.status === 'UPCOMING'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }
                    >
                      {ticket.status === 'UPCOMING' ? 'Upcoming' : 'Completed'}
                    </Badge>
                  </div>

                  {/* Event Details */}
                  <div className="text-xs space-y-1 text-slate-600">
                    <p className="font-medium text-slate-700">{ticket.ticketType}</p>
                    <p>{ticket.eventDate} • {ticket.eventTime}</p>
                    <p className="text-slate-500">{ticket.venue}</p>
                    <p className="font-medium text-indigo-600">{ticket.price}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-indigo-600 hover:bg-indigo-50"
                    >
                      <Download size={14} className="mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-slate-600 hover:bg-slate-100"
                    >
                      <Share2 size={14} className="mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-slate-600 mb-4">No tickets found matching your search.</p>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Browse Events
          </Button>
        </Card>
      )}

      {/* Pagination Info */}
      {filteredAndSortedTickets.length > 0 && (
        <p className="text-xs text-slate-500 text-center">
          Showing {filteredAndSortedTickets.length} of {TICKETS_DATA.length} tickets
        </p>
      )}
    </div>
  )
}
