import axiosClient from '@/lib/axios'
import {
  CustomerLookupDTO,
  OrderCreateDTO,
  OrderResponseDTO,
  PosEvent,
  SeatCatalogDTO,
} from '@/lib/types/pos.type'

export const posService = {
  lookupCustomer: async (phone: string): Promise<CustomerLookupDTO> => {
    const response = await axiosClient.get<{ data: CustomerLookupDTO }>(
      '/orders/pos/customers/lookup',
      { params: { phone } }
    )
    return response.data
  },

  getEvents: async (): Promise<PosEvent[]> => {
    const response = await axiosClient.get<{ data: PosEvent[] }>('/orders/pos/events')
    return response.data
  },

  getCatalog: async (eventId: string): Promise<SeatCatalogDTO> => {
    const response = await axiosClient.get<{ data: SeatCatalogDTO }>(
      `/orders/pos/events/${eventId}/catalog`
    )
    return response.data
  },

  createOrder: async (data: OrderCreateDTO): Promise<OrderResponseDTO> => {
    const response = await axiosClient.post<{ data: OrderResponseDTO }>('/orders/pos', data)
    return response.data
  },

  getOrderByCode: async (orderCode: string): Promise<OrderResponseDTO> => {
    const response = await axiosClient.get<{ data: OrderResponseDTO }>(
      `/orders/pos/${orderCode}`
    )
    return response.data
  },
}
