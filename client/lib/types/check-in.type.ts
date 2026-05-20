export type TicketStatus = 'UNUSED' | 'USED' | 'CANCELED'
export type CheckInResultStatus = 'ACCEPTED' | 'ALREADY_USED' | 'INVALID' | 'CANCELED' | 'ERROR'

export interface CheckInEvent {
  id: string
  name: string
  location: string
  bannerUrl?: string | null
  startTime?: string | null
  endTime?: string | null
  status: 'ONSALE' | 'ENDED'
}

export interface CheckInTicket {
  ticketId: string
  seatLabel: string
  label?: string | null
  ticketClassId: string
  ticketClassName?: string | null
  price: number
  status: TicketStatus
  checkInTime?: string | null
  checkInBy?: string | null
  checkInByName?: string | null
}

export interface CheckInOrder {
  orderId: string
  orderCode: string
  eventId: string
  customerId: string
  customerName?: string | null
  phone?: string | null
  status: 'PAID' | 'CANCELED'
  totalAmount: number
  tickets: CheckInTicket[]
}

export interface CheckInResponse {
  result: CheckInResultStatus
  message: string
  orderId: string
  orderCode: string
  eventId: string
  customerId: string
  customerName?: string | null
  phone?: string | null
  ticket?: CheckInTicket | null
  checkedAt?: string | null
  checkInBy?: string | null
  checkInByName?: string | null
}

export interface CheckInHistoryItem {
  ticketId: string
  orderId?: string | null
  orderCode?: string | null
  eventId?: string | null
  eventName?: string | null
  customerId?: string | null
  customerName?: string | null
  phone?: string | null
  seatLabel?: string | null
  ticketClassId?: string | null
  ticketClassName?: string | null
  price?: number | null
  status: TicketStatus
  checkInTime?: string | null
  checkInBy?: string | null
  checkInByName?: string | null
}
