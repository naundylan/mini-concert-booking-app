import axiosClient from "@/lib/axios";
import {
  AdminTicketClassCreateDTO,
  AdminTicketClassUpdateDTO,
  Event,
  EventCreateDTO,
  EventUpdateDTO,
  TicketClass,
} from "@/lib/types/event.type";

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

  adminGetTicketClasses: async (eventId: string): Promise<{ data: TicketClass[] }> =>
    axiosClient.get<{ data: TicketClass[] }>(`/admin/events/${eventId}/ticket-classes`),

  adminCreateTicketClass: async (
    eventId: string,
    data: AdminTicketClassCreateDTO
  ): Promise<{ data: TicketClass }> =>
    axiosClient.post<{ data: TicketClass }>(`/admin/events/${eventId}/ticket-classes`, data),

  adminUpdateTicketClass: async (
    id: string,
    data: AdminTicketClassUpdateDTO
  ): Promise<{ data: TicketClass }> =>
    axiosClient.patch<{ data: TicketClass }>(`/admin/ticket-classes/${id}`, data),

  adminDeleteTicketClass: async (id: string): Promise<{ data: null }> =>
    axiosClient.delete<{ data: null }>(`/admin/ticket-classes/${id}`),

};
