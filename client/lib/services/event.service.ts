import axiosClient from "@/lib/axios";
import { Event, EventCreateDTO, EventUpdateDTO } from "@/lib/types/event.type";

export const eventService = {
  getAll: async (params?: any): Promise<{ data: Event[] }> =>
    axiosClient.get<{ data: Event[] }>('/events', { params }),

  getById: async (id: string): Promise<{ data: Event }> =>
    axiosClient.get<{ data: Event }>(`/events/${id}`),

  create: async (data: EventCreateDTO): Promise<{ data: Event }> =>
    axiosClient.post<{ data: Event }>('/events', data),

  update: async (id: string, data: EventUpdateDTO): Promise<{ data: Event }> =>
    axiosClient.patch<{ data: Event }>(`/events/${id}`, data),

  updateStatus: async (id: string, data: { status: string }): Promise<{ data: Event }> =>
    axiosClient.patch<{ data: Event }>(`/events/${id}/status`, data),
};