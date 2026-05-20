export type PaymentMethod = 'CASH' | 'BANK_TRANSFER'
export type SeatStatus = 'AVAILABLE' | 'MAINTENANCE' | 'SOLD' | 'LOCKED'

export interface CustomerLookupDTO {
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

export interface OrderItemResponseDTO {
  id?: string
  seatId: string
  ticketClassId: string
  seatLabel: string
  ticketClassName?: string | null
  price: number
  gridRow?: number
  gridColumn?: number
  seatStatus?: SeatStatus
  label?: string
  status?: SeatStatus
  ticketClass?: {
    id: string
    name: string
    colorCode?: string | null
    price: number
  } | null
}

export interface SeatCatalogDTO {
  eventId: string
  eventName: string
  ticketClasses: Array<{
    id: string
    name: string
    colorCode?: string | null
    price: number
  }>
  seats: OrderItemResponseDTO[]
}

export interface PaymentCreateDTO {
  paymentMethod: PaymentMethod
  amountReceived?: number
}

export interface OrderCreateDTO {
  eventId: string
  phone: string
  fullName: string
  email?: string
  seatIds: string[]
  payment: PaymentCreateDTO
}

export interface OrderResponseDTO {
  orderId: string
  orderCode: string
  customerId: string
  status: 'PAID' | 'CANCELED'
  totalAmount: number
  paymentMethod: PaymentMethod
  paymentStatus: 'CONFIRMED' | 'WAITING_GATEWAY' | 'FAILED'
  amountReceived?: number | null
  items: OrderItemResponseDTO[]
}
