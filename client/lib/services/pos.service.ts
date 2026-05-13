import axiosClient from '@/lib/axios'
import {
  PosBookingCreateRequest,
  PosBookingResponse,
  PosCatalog,
  PosCustomerLookupResponse,
  PosEvent,
} from '@/lib/types/pos.type'

export const posService = {
  lookupCustomer: async (phone: string): Promise<PosCustomerLookupResponse> => {
    const response = await axiosClient.get<{ data: PosCustomerLookupResponse }>(
      '/bookings/pos/customers/lookup',
      { params: { phone } }
    )
    return response.data
  },

  getEvents: async (): Promise<PosEvent[]> => {
    const response = await axiosClient.get<{ data: PosEvent[] }>('/bookings/pos/events')
    return response.data
  },

  getCatalog: async (eventId: string): Promise<PosCatalog> => {
    const response = await axiosClient.get<{ data: PosCatalog }>(
      `/bookings/pos/events/${eventId}/catalog`
    )
    return response.data
  },

  createBooking: async (data: PosBookingCreateRequest): Promise<PosBookingResponse> => {
    const response = await axiosClient.post<{ data: PosBookingResponse }>('/bookings/pos', data)
    return response.data
  },
}
