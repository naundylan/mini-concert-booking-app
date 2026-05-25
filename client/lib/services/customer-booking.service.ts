import axiosClient from '@/lib/axios'
import {
  CheckoutRequestDTO,
  CheckoutSessionDTO,
  CustomerEventDetailDTO,
  CustomerEventStatus,
  CustomerEventSummaryDTO,
  CustomerOrderDTO,
  CustomerSeatCatalogDTO,
  CustomerTicketDTO,
  PageResponse,
} from '@/lib/types/customer-booking.type'

export const customerBookingService = {
  getEvents: async (params?: {
    keyword?: string
    status?: CustomerEventStatus | 'ALL'
    page?: number
    size?: number
  }): Promise<PageResponse<CustomerEventSummaryDTO>> => {
    const response = await axiosClient.get<{ data: PageResponse<CustomerEventSummaryDTO> }>(
      '/customer/events',
      {
        params: {
          ...params,
          status: params?.status === 'ALL' ? undefined : params?.status,
        },
      }
    )
    return response.data
  },

  getEventDetail: async (eventId: string): Promise<CustomerEventDetailDTO> => {
    const response = await axiosClient.get<{ data: CustomerEventDetailDTO }>(
      `/customer/events/${eventId}`
    )
    return response.data
  },

  getCatalog: async (eventId: string): Promise<CustomerSeatCatalogDTO> => {
    const response = await axiosClient.get<{ data: CustomerSeatCatalogDTO }>(
      `/customer/events/${eventId}/catalog`
    )
    return response.data
  },

  createCheckout: async (data: CheckoutRequestDTO): Promise<CheckoutSessionDTO> => {
    const response = await axiosClient.post<{ data: CheckoutSessionDTO }>('/customer/checkout', data)
    return response.data
  },

  getCheckoutSession: async (paymentSessionId: string): Promise<CheckoutSessionDTO> => {
    const response = await axiosClient.get<{ data: CheckoutSessionDTO }>(
      `/customer/checkout/${paymentSessionId}`
    )
    return response.data
  },

  releaseCheckout: async (paymentSessionId: string): Promise<void> => {
    await axiosClient.delete<{ data: null }>(`/customer/checkout/${paymentSessionId}`)
  },

  confirmDevPayment: async (paymentSessionId: string): Promise<CustomerOrderDTO> => {
    const response = await axiosClient.post<{ data: CustomerOrderDTO }>(
      `/customer/checkout/${paymentSessionId}/confirm-dev`
    )
    return response.data
  },

  getOrders: async (params?: {
    page?: number
    size?: number
  }): Promise<PageResponse<CustomerOrderDTO>> => {
    const response = await axiosClient.get<{ data: PageResponse<CustomerOrderDTO> }>(
      '/customer/orders',
      { params }
    )
    return response.data
  },

  getOrder: async (orderId: string): Promise<CustomerOrderDTO> => {
    const response = await axiosClient.get<{ data: CustomerOrderDTO }>(`/customer/orders/${orderId}`)
    return response.data
  },

  getTickets: async (params?: {
    page?: number
    size?: number
  }): Promise<PageResponse<CustomerTicketDTO>> => {
    const response = await axiosClient.get<{ data: PageResponse<CustomerTicketDTO> }>(
      '/customer/tickets',
      { params }
    )
    return response.data
  },

  getTicket: async (ticketId: string): Promise<CustomerTicketDTO> => {
    const response = await axiosClient.get<{ data: CustomerTicketDTO }>(
      `/customer/tickets/${ticketId}`
    )
    return response.data
  },
}
