'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

interface SelectedSeat {
  row: string
  col: number
  type: 'vip' | 'general'
}

const SEAT_MAP = {
  vip: [
    { row: 'A', cols: 12, type: 'vip' },
    { row: 'B', cols: 12, type: 'vip' },
  ],
  general: [
    { row: 'C', cols: 16, type: 'general' },
    { row: 'D', cols: 16, type: 'general' },
    { row: 'E', cols: 16, type: 'general' },
    { row: 'F', cols: 16, type: 'general' },
  ],
}

const SEAT_PRICES = {
  vip: 120.0,
  general: 45.0,
}

export default function SeatSelectionPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId

  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([])
  const [holdingSeats, setHoldingSeats] = useState<Set<string>>(new Set())
  const [holdingTimers, setHoldingTimers] = useState<Record<string, number>>({})

  // Simulate holding timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setHoldingTimers((prev) => {
        const updated = { ...prev }
        for (const seatId of holdingSeats) {
          if (updated[seatId] !== undefined) {
            updated[seatId] -= 1
            if (updated[seatId] <= 0) {
              // Release the hold after 60 seconds
              setHoldingSeats((s) => {
                const newSet = new Set(s)
                newSet.delete(seatId)
                return newSet
              })
              delete updated[seatId]
            }
          }
        }
        return updated
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [holdingSeats])

  const handleSeatClick = (row: string, col: number, type: 'vip' | 'general') => {
    const seatId = `${row}-${col}`
    
    // Check if already selected
    if (selectedSeats.some((s) => s.row === row && s.col === col)) {
      setSelectedSeats(selectedSeats.filter((s) => !(s.row === row && s.col === col)))
      setHoldingSeats((prev) => {
        const newSet = new Set(prev)
        newSet.delete(seatId)
        return newSet
      })
      return
    }

    // Add to selected
    setSelectedSeats([...selectedSeats, { row, col, type }])
    setHoldingSeats((prev) => new Set(prev).add(seatId))
    setHoldingTimers((prev) => ({ ...prev, [seatId]: 60 }))
  }

  const subtotal = selectedSeats.reduce((sum, seat) => sum + SEAT_PRICES[seat.type], 0)
  const serviceFee = subtotal * 0.05
  const total = subtotal + serviceFee

  const handleReviewOrder = () => {
    if (selectedSeats.length === 0) return
    // Store booking in state/context and navigate
    router.push(`/customer/booking/${eventId}/confirmation?seats=${selectedSeats.map((s) => `${s.row}${s.col}`).join(',')}`)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/customer/events/${eventId}`}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4 text-sm font-medium"
        >
          <ChevronLeft size={16} />
          BACK TO EVENT DETAILS
        </Link>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          The Velvet Cellar: Midnight Jazz
        </h1>
        <p className="text-slate-600">
          Saturday, Oct 24 • Doors at 8:00 PM • New York City, NY
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seating Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-8 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Seating Map</h2>
            <p className="text-sm text-slate-600 mb-6">Select your preferred zone in the venue</p>

            {/* Legend */}
            <div className="flex items-center gap-6 mb-8 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-indigo-600 rounded" />
                <span className="text-xs text-slate-600">VIP Lounge</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-indigo-400 rounded" />
                <span className="text-xs text-slate-600">General Admission</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-300 rounded" />
                <span className="text-xs text-slate-600">Holding (60s)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-300 rounded" />
                <span className="text-xs text-slate-600">Sold Out</span>
              </div>
            </div>

            {/* Stage Label */}
            <div className="text-center mb-8">
              <p className="text-xs font-semibold text-slate-400 tracking-widest">STAGE FOCUS AREA</p>
            </div>

            {/* Seats */}
            <div className="space-y-4">
              {Object.values(SEAT_MAP)
                .flat()
                .map((section) => (
                  <div key={section.row} className="flex items-center gap-4">
                    <span className="w-8 text-sm font-semibold text-slate-600">{section.row}</span>
                    <div className="flex gap-2">
                      {Array.from({ length: section.cols }).map((_, idx) => {
                        const col = idx + 1
                        const seatId = `${section.row}-${col}`
                        const isSelected = selectedSeats.some((s) => s.row === section.row && s.col === col)
                        const isHolding = holdingSeats.has(seatId)
                        const isSoldOut = Math.random() > 0.85 // Mock 15% sold out

                        return (
                          <button
                            key={seatId}
                            onClick={() =>
                              !isSoldOut && handleSeatClick(section.row, col, section.type)
                            }
                            disabled={isSoldOut}
                            className={`w-6 h-6 rounded text-xs font-semibold transition-all duration-200 ${
                              isSoldOut
                                ? 'bg-slate-300 cursor-not-allowed'
                                : isSelected || isHolding
                                  ? `${
                                      section.type === 'vip'
                                        ? 'bg-yellow-300 text-slate-900'
                                        : 'bg-yellow-300 text-slate-900'
                                    } ring-2 ring-offset-1 ring-yellow-400`
                                  : `${
                                      section.type === 'vip' ? 'bg-indigo-600' : 'bg-indigo-400'
                                    } text-white hover:ring-2 hover:ring-offset-1 hover:ring-yellow-300 cursor-pointer`
                            }`}
                            title={seatId}
                          >
                            {isHolding && holdingTimers[seatId] ? (
                              <span className="text-xs">{holdingTimers[seatId]}</span>
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Ticket Selection Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 border border-slate-200 sticky top-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Select Tickets</h3>

            {/* Ticket Options */}
            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">General Admission</h4>
                    <p className="text-xs text-slate-600">Access to main floor & standing</p>
                  </div>
                  <span className="text-indigo-600 font-bold">$45.00</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-600">In your selection</span>
                  <span className="text-lg font-bold text-indigo-600">
                    {selectedSeats.filter((s) => s.type === 'general').length}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">VIP Lounge Access</h4>
                    <p className="text-xs text-slate-600">Premium seating & 2-zone access</p>
                  </div>
                  <span className="text-indigo-600 font-bold">$120.00</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-600">Only 12 left</span>
                  <span className="text-lg font-bold text-indigo-600">
                    {selectedSeats.filter((s) => s.type === 'vip').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 pt-4 border-t border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Service Fee</span>
                <span className="font-semibold text-slate-900">${serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="text-indigo-600">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleReviewOrder}
              disabled={selectedSeats.length === 0}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg"
            >
              Review Order
            </Button>

            {/* Promo Section */}
            <div className="mt-6 p-4 rounded-lg bg-indigo-900 text-white">
              <h4 className="font-semibold text-sm mb-2">Unlock Member Pricing</h4>
              <p className="text-xs">Save up to 15% on VIP tickets with a Curator membership</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
