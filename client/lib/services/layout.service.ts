import axiosClient from '@/lib/axios'
import {
  LayoutApplyPayload,
  LayoutPageResponse,
  LayoutPayload,
  LayoutStatus,
  SeatLayout,
} from '@/lib/types/layout.type'

export const layoutService = {
  search: async (params?: {
    page?: number
    size?: number
    keyword?: string
    status?: LayoutStatus | ''
  }): Promise<LayoutPageResponse> => {
    return axiosClient.get<LayoutPageResponse>('/admin/layouts', { params })
  },

  create: async (data: Required<Pick<LayoutPayload, 'name' | 'layoutData'>> & LayoutPayload): Promise<SeatLayout> => {
    const response = await axiosClient.post<{ data: SeatLayout }>('/admin/layouts', data)
    return response.data
  },

  update: async (id: string, data: LayoutPayload): Promise<SeatLayout> => {
    const response = await axiosClient.patch<{ data: SeatLayout }>(`/admin/layouts/${id}`, data)
    return response.data
  },

  publish: async (id: string): Promise<SeatLayout> => {
    const response = await axiosClient.post<{ data: SeatLayout }>(`/admin/layouts/${id}/publish`)
    return response.data
  },

  clone: async (id: string): Promise<SeatLayout> => {
    const response = await axiosClient.post<{ data: SeatLayout }>(`/admin/layouts/${id}/clone`)
    return response.data
  },

  archive: async (id: string): Promise<void> => {
    await axiosClient.delete(`/admin/layouts/${id}`)
  },

  apply: async (
    eventId: string,
    layoutId: string,
    data: LayoutApplyPayload
  ): Promise<{ createdCount: number }> => {
    const response = await axiosClient.post<{ data: { createdCount: number } }>(
      `/admin/events/${eventId}/layouts/${layoutId}/apply`,
      data
    )
    return response.data
  },
}
