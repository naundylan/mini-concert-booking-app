'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Download, Share2 } from 'lucide-react'

export default function BookingSuccessPage() {
  const orderId = 'ORD-88219'
  const bookingId = '#TK-88219'
  const eventName = 'Neon Velvet Nights'
  const eventDate = 'Friday, Oct 24, 2024'
  const eventTime = '9:00 PM – 3:00 AM'
  const eventLocation = 'The Onyx Atrium, NYC'
  const seats = ['A-14', 'A-15']

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Booking Confirmed!</h1>
          <p className="text-lg text-slate-600">Your tickets have been successfully secured.</p>
        </div>

        {/* Ticket Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {/* Event Banner */}
          <div className="relative h-48 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=300&fit=crop"
              alt="Event banner"
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
            <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
              PAID
            </div>
          </div>

          {/* Ticket Details */}
          <div className="p-8">
            {/* Event Info */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">{eventName}</h2>
              <div className="space-y-2 text-slate-600">
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>{eventDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🕐</span>
                  <span>{eventTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{eventLocation}</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200 py-8 my-8" />

            {/* Booking Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-sm text-slate-600 mb-1">Order ID</p>
                <p className="text-lg font-bold text-slate-900">{orderId}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Booking ID</p>
                <p className="text-lg font-bold text-slate-900">{bookingId}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Number of Tickets</p>
                <p className="text-lg font-bold text-slate-900">{seats.length} Ticket(s)</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Amount Paid</p>
                <p className="text-lg font-bold text-indigo-600">$402.50</p>
              </div>
            </div>

            {/* Seats */}
            <div className="bg-indigo-50 rounded-lg p-6 mb-8">
              <p className="text-sm font-semibold text-slate-900 mb-3">Assigned Seats</p>
              <div className="flex flex-wrap gap-3">
                {seats.map((seat) => (
                  <div
                    key={seat}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm"
                  >
                    {seat}
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code Section */}
            <div className="bg-slate-50 rounded-lg p-8 text-center mb-8">
              <p className="text-sm text-slate-600 mb-4">Your E-Ticket</p>
              <div className="inline-block bg-white p-4 rounded-lg">
                <svg
                  className="w-32 h-32"
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="100" height="100" fill="white" />
                  <rect x="10" y="10" width="30" height="30" fill="black" />
                  <rect x="60" y="10" width="30" height="30" fill="black" />
                  <rect x="10" y="60" width="30" height="30" fill="black" />
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
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Show this QR code at the venue entrance for entry
              </p>
            </div>

            {/* Important Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-amber-900">
                <span className="font-semibold">⚠️ Important:</span> A confirmation email with your e-ticket has been
                sent. Please check your email for ticket details and terms.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 py-3 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              >
                <Download size={20} />
                Download Ticket
              </Button>
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 py-3 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              >
                <Share2 size={20} />
                Share with Friends
              </Button>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link href="/customer/events">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold">
              Browse More Events
            </Button>
          </Link>
          <Link href="/customer/my-tickets">
            <Button
              variant="outline"
              className="w-full py-3 rounded-lg font-semibold border-indigo-600 text-indigo-600 hover:bg-indigo-50"
            >
              View My Tickets
            </Button>
          </Link>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 text-sm text-slate-600">
          <p className="mb-2">Questions? Contact support@kineticcurator.com</p>
          <p>Cancellation window: 48 hours before event start</p>
        </div>
      </div>
    </div>
  )
}
