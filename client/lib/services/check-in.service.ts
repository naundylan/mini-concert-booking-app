import axiosClient from '@/lib/axios'
import {
  CheckInEvent,
  CheckInHistoryItem,
  CheckInOrder,
  CheckInResponse,
} from '@/lib/types/check-in.type'

export const checkInService = {
  getEvents: async (): Promise<CheckInEvent[]> => {
    const response = await axiosClient.get<{ data: CheckInEvent[] }>('/check-in/events')
    return response.data
  },

  search: async (eventId: string, keyword: string): Promise<CheckInOrder[]> => {
    const response = await axiosClient.get<{ data: CheckInOrder[] }>('/check-in/search', {
      params: { eventId, keyword },
    })
    return response.data
  },

  checkInTicket: async (ticketId: string, eventId: string): Promise<CheckInResponse> => {
    const response = await axiosClient.post<{ data: CheckInResponse }>(
      `/check-in/tickets/${ticketId}`,
      { eventId }
    )
    return response.data
  },

  getHistory: async (params?: {
    eventId?: string
    keyword?: string
  }): Promise<CheckInHistoryItem[]> => {
    const response = await axiosClient.get<{ data: CheckInHistoryItem[] }>('/check-in/history', {
      params,
    })
    return response.data
  },
}
