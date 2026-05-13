'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Clock } from 'lucide-react'

export default function OrderConfirmationPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const eventId = params.eventId
  const seatsString = searchParams.get('seats') || ''

  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [isExpired, setIsExpired] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`

  const handlePayment = () => {
    // Mock payment process
    if (!isExpired) {
      router.push(`/customer/booking/${eventId}/success`)
    }
  }

  const seats = seatsString.split(',').filter(Boolean)
  const subtotal = seats.length * 85.0 // Mock calculation
  const serviceFee = subtotal * 0.07
  const tax = (subtotal + serviceFee) * 0.08
  const total = subtotal + serviceFee + tax

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/customer/booking/${eventId}/seats`}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4 text-sm font-medium"
          >
            <ChevronLeft size={16} />
            BACK TO SEAT SELECTION
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Confirm your neon experience.</h1>
        </div>

        {/* Timer Alert */}
        {isExpired ? (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <Clock size={20} className="text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Payment session expired</h3>
              <p className="text-sm text-red-700">
                Your hold on seats has been released. Please select seats again to continue.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-indigo-600" />
              <div>
                <h3 className="font-semibold text-indigo-900">Payment expires in</h3>
                <p className="text-sm text-indigo-700">Complete payment before your hold expires</p>
              </div>
            </div>
            <div className={`text-3xl font-bold font-mono ${timeLeft > 120 ? 'text-indigo-600' : 'text-red-600'}`}>
              {formattedTime}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Event & QR Code */}
          <div className="space-y-6">
            {/* Event Banner */}
            <div className="rounded-xl overflow-hidden">
              <div className="relative h-64 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=300&fit=crop"
                  alt="Event banner"
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
                <div className="absolute top-4 left-4 bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  FEB 24 • 9:50 PM
                </div>
              </div>
            </div>

            {/* Event Info */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Neon Velvet Nights</h2>
              <div className="flex items-start gap-4 text-sm text-slate-600">
                <div>📍 The Luminary Pavilion, NYC</div>
                <div>🎫 {seats.length} Tickets Secured</div>
              </div>
            </div>

            {/* Assigned Seating */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Assigned Seating</h3>
              <div className="space-y-3">
                {seats.map((seat, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-xs">★</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        1x {idx === 0 ? 'VIP Access' : 'General Admission'}
                      </p>
                      <p className="text-xs text-slate-600">
                        Seat {seat} • {idx === 0 ? 'Premium Lounge Access' : 'Standard Entry'}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">${idx === 0 ? '180.00' : '85.00'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: QR Code & Order Summary */}
          <div className="space-y-6">
            {/* QR Code Section */}
            <div className="bg-white rounded-xl p-8 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">VNPay Payment</h3>
              <div className="bg-slate-100 rounded-lg p-8 flex items-center justify-center mb-4">
                <div className="text-center">
                  {/* QR Code Mock */}
                  <svg
                    className="w-48 h-48 mx-auto mb-4"
                    viewBox="0 0 100 100"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="100" height="100" fill="white" />
                    <rect x="10" y="10" width="30" height="30" fill="black" />
                    <rect x="60" y="10" width="30" height="30" fill="black" />
                    <rect x="10" y="60" width="30" height="30" fill="black" />
                    {/* Grid pattern for QR appearance */}
                    {Array.from({ length: 25 }).map((_, i) => (
                      <rect
                        key={i}
                        x={20 + (i % 5) * 10}
                        y={20 + Math.floor(i / 5) * 10}
                        width="8"
                        height="8"
                        fill={Math.random() > 0.5 ? 'black' : 'white'}
                      />
                    ))}
                  </svg>
                  <p className="text-sm text-slate-600">Scan with VNPay app or any QR scanner</p>
                </div>
              </div>
              <p className="text-xs text-center text-slate-500 p-3 bg-slate-50 rounded">
                Payment link expires in {formattedTime}
              </p>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4 pb-4 border-b border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal ({seats.length} tickets)</span>
                  <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Service fee</span>
                  <span className="font-semibold text-slate-900">${serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Processing Tax (8%)</span>
                  <span className="font-semibold text-slate-900">${tax.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-slate-900">Total Amount</span>
                <span className="text-3xl font-bold text-indigo-600">${total.toFixed(2)}</span>
              </div>

              {/* Payment Method Icons */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200">
                <span className="text-xs font-medium text-slate-600">Payment Methods:</span>
                <div className="flex gap-2">
                  <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-800 rounded text-white text-xs font-bold flex items-center justify-center">
                    💳
                  </div>
                  <div className="w-8 h-5 bg-purple-600 rounded text-white text-xs font-bold flex items-center justify-center">
                    📱
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                onClick={handlePayment}
                disabled={isExpired}
                className={`w-full py-3 rounded-lg font-semibold ${
                  isExpired
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isExpired ? 'Payment Session Expired' : 'Proceed to Payment →'}
              </Button>

              {/* Policy Footer */}
              <p className="text-xs text-slate-500 text-center mt-4">
                By proceeding, you agree to our Terms of Service and Refund Policy.
                <br />
                All sales are final. Refunds valid until event start.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
