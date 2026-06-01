export type CustomerEventStatus = 'TEASING' | 'ONSALE'
export type CustomerSeatStatus = 'AVAILABLE' | 'SOLD' | 'LOCKED' | 'MAINTENANCE' | 'HELD'
export type CustomerPaymentMethod = 'BANK_TRANSFER' | 'VNPAY' | 'VIETQR'
export type VnPayReturnStatus = 'PAID' | 'FAILED' | 'PENDING' | 'EXPIRED'
export type CheckoutPaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED'
export type CustomerOrderStatus = 'PAID' | 'CANCELED'
export type CustomerPaymentStatus = 'CONFIRMED' | 'WAITING_GATEWAY' | 'FAILED'
export type CustomerTicketStatus = 'UNUSED' | 'USED' | 'CANCELED'

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface CustomerTicketClassDTO {
  id: string
  name: string
  colorCode?: string | null
  price: number
}

export interface CustomerSeatSummaryDTO {
  total: number
  available: number
}

export interface CustomerEventSummaryDTO {
  id: string
  name: string
  location: string
  bannerUrl?: string | null
  teasingTime?: string | null
  openTime?: string | null
  startTime?: string | null
  endTime?: string | null
  status: CustomerEventStatus
  ticketClasses?: CustomerTicketClassDTO[] | null
  seatSummary?: CustomerSeatSummaryDTO | null
}

export interface CustomerEventDetailDTO extends CustomerEventSummaryDTO {
  description?: string | null
}

export interface CustomerSeatDTO {
  id: string
  label: string
  gridRow: number
  gridColumn: number
  ticketClassId: string
  ticketClassName: string
  price: number
  colorCode?: string | null
  status: CustomerSeatStatus
}

export interface CustomerSeatCatalogDTO {
  eventId: string
  eventName: string
  generatedAt: string
  seats: CustomerSeatDTO[]
}

export interface CheckoutRequestDTO {
  eventId: string
  seatIds: string[]
  paymentMethod: CustomerPaymentMethod
}

export interface BankTransferInfoDTO {
  accountNumber: string
  accountName: string
  amount: number
  content: string
}

export interface CheckoutSessionDTO {
  paymentSessionId: string
  customerId?: string
  eventId: string
  expiresAt: string
  totalAmount: number
  bankTransferInfo: BankTransferInfoDTO
  selectedSeats: CustomerSeatDTO[]
}

export interface VnPayPaymentUrlDTO {
  paymentUrl: string
}

export interface VnPayReturnResultDTO {
  status: VnPayReturnStatus
  eventId?: string | null
  orderId?: string | null
  paymentSessionId?: string | null
  message?: string | null
}

export interface VietQrPaymentDTO {
  qrUrl: string
  bankId: string
  accountNo: string
  accountName: string
  amount: number
  content: string
  expiredAt: string
}

export interface CheckoutPaymentStatusDTO {
  status: CheckoutPaymentStatus
  paymentMethod: CustomerPaymentMethod
  orderId?: string | null
}

export interface CustomerOrderDTO {
  orderId: string
  orderCode: string
  customerId: string
  eventId?: string
  eventName?: string | null
  eventLocation?: string | null
  eventStartTime?: string | null
  status: CustomerOrderStatus
  totalAmount: number
  paymentMethod: CustomerPaymentMethod
  paymentStatus: CustomerPaymentStatus
  amountReceived?: number | null
  items: CustomerTicketDTO[]
}

export interface CustomerTicketDTO {
  id: string
  ticketId?: string
  orderId?: string
  orderCode?: string
  eventId?: string
  eventName?: string | null
  eventLocation?: string | null
  eventStartTime?: string | null
  seatId: string
  seatLabel: string
  label?: string
  ticketClassId: string
  ticketClassName?: string | null
  price: number
  status?: CustomerTicketStatus
  qrPayload?: string
  ticketClass?: CustomerTicketClassDTO | null
}

export interface SeatSnapshotEvent {
  eventId: string
  heldSeatIds: string[]
  soldSeatIds: string[]
  generatedAt: string
}

export interface SeatHeldEvent {
  eventId: string
  seatIds: string[]
  expiresAt: string
}

export interface SeatChangedEvent {
  eventId: string
  seatIds: string[]
}
