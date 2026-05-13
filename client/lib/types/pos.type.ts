export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'VNPAY'
export type SeatStatus = 'AVAILABLE' | 'MAINTENANCE' | 'SOLD' | 'LOCKED'

export interface PosCustomerLookupResponse {
  found: boolean
  customerId?: string
  phone: string
  fullName?: string
  email?: string
  onlineVerified?: boolean
}

export interface PosEvent {
  id: string
  name: string
  location: string
  bannerUrl?: string | null
  startTime?: string | null
  status: string
}

export interface PosTicketClass {
  id: string
  name: string
  colorCode?: string | null
  price: number
}

export interface PosSeat {
  id: string
  ticketClassId: string
  ticketClassName: string
  price: number
  gridRow: number
  gridColumn: number
  label: string
  status: SeatStatus
}

export interface PosCatalog {
  eventId: string
  eventName: string
  ticketClasses: PosTicketClass[]
  seats: PosSeat[]
}

export interface PosBookingCreateRequest {
  eventId: string
  phone: string
  fullName: string
  email?: string
  seatIds: string[]
  paymentMethod: PaymentMethod
  amountReceived?: number
}

export interface PosBookingResponse {
  bookingId: string
  bookingCode: string
  customerId: string
  status: 'PENDING_PAYMENT' | 'PAID' | 'CANCELED'
  paymentMethod: PaymentMethod
  paymentStatus: 'STAFF_CONFIRMATION_REQUIRED' | 'CONFIRMED' | 'WAITING_GATEWAY' | 'FAILED'
  totalAmount: number
  amountReceived?: number | null
  seatLabels: string[]
  paymentUrl?: string | null
}
