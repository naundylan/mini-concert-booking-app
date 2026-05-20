'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Search, MapPin, Calendar, Clock } from 'lucide-react'

// Mock events data
const EVENTS_DATA = [
  {
    id: '1',
    name: 'Neon Velvet Nights',
    date: '2024-10-24',
    time: '21:00',
    venue: 'The Onyx Atrium, NYC',
    thumbnail: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=300&fit=crop',
    status: 'ONSALE',
    price: '$85',
    artist: 'Neon Curator',
  },
  {
    id: '2',
    name: 'Jazz in the Park',
    date: '2024-09-15',
    time: '18:00',
    venue: 'Central Park, Denver',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=300&fit=crop',
    status: 'TEASING',
    price: '$45',
    artist: 'Jazz Collective',
  },
  {
    id: '3',
    name: 'Tech Summit 2024',
    date: '2024-11-05',
    time: '08:00',
    venue: 'Convention Center, SF',
    thumbnail: 'https://images.unsplash.com/photo-1540575467063-178f50002c4b?w=400&h=300&fit=crop',
    status: 'ONSALE',
    price: '$299',
    artist: 'Tech Leaders',
  },
  {
    id: '4',
    name: 'Indie Music Festival',
    date: '2024-08-20',
    time: '16:00',
    venue: 'Riverside Amphitheater, Austin',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop',
    status: 'TEASING',
    price: '$75',
    artist: 'Independent Artists',
  },
  {
    id: '5',
    name: 'Classical Symphony Night',
    date: '2024-10-30',
    time: '19:30',
    venue: 'Carnegie Hall, NYC',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    status: 'ONSALE',
    price: '$120',
    artist: 'Philharmonic Orchestra',
  },
  {
    id: '6',
    name: 'Electronic Dreams Festival',
    date: '2024-09-08',
    time: '20:00',
    venue: 'Lakeside Venue, LA',
    thumbnail: 'https://images.unsplash.com/photo-1478147427282-58a87d1ea50b?w=400&h=300&fit=crop',
    status: 'TEASING',
    price: '$95',
    artist: 'EDM Masters',
  },
]

type Event = typeof EVENTS_DATA[0]

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('date-asc')

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = EVENTS_DATA.filter((event) => {
      const matchesSearch =
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.artist.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter
      return matchesSearch && matchesStatus
    })

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Explore Events</h1>
        <p className="text-slate-600 text-sm">Discover and book your next experience</p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search events, artists, venues..."
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
              <option value="ALL">All Events</option>
              <option value="ONSALE">On Sale</option>
              <option value="TEASING">Coming Soon</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date-asc">Soonest First</option>
              <option value="date-desc">Latest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {filteredAndSortedEvents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative h-48 bg-slate-200 overflow-hidden group">
                <img
                  src={event.thumbnail}
                  alt={event.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <Badge
                  className={
                    event.status === 'ONSALE'
                      ? 'absolute top-3 right-3 bg-green-500 text-white border-0'
                      : 'absolute top-3 right-3 bg-amber-500 text-white border-0'
                  }
                >
                  {event.status === 'ONSALE' ? 'On Sale' : 'Coming Soon'}
                </Badge>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Title */}
                <div>
                  <h3 className="font-semibold text-slate-900 line-clamp-2 mb-1">{event.name}</h3>
                  <p className="text-xs text-slate-500">{event.artist}</p>
                </div>

                {/* Event Details */}
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-indigo-600 flex-shrink-0" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-indigo-600 flex-shrink-0" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-indigo-600 flex-shrink-0" />
                    <span className="line-clamp-1">{event.venue}</span>
                  </div>
                </div>

                {/* Price & CTA */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="font-bold text-indigo-600 text-lg">{event.price}</span>
                  <Link href={`/customer/booking/${event.id}/seats`}>
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Book Now
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-slate-600 mb-4">No events found matching your search.</p>
          <Button
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('ALL')
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Clear Filters
          </Button>
        </Card>
      )}

      {/* Results Summary */}
      {filteredAndSortedEvents.length > 0 && (
        <p className="text-xs text-slate-500 text-center">
          Showing {filteredAndSortedEvents.length} of {EVENTS_DATA.length} events
        </p>
      )}
    </div>
  )
}
