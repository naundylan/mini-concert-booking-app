import axiosClient from "@/lib/axios";
import { AdminOrderResponse, AdminOrderDetailResponse } from "../types/admin-order.type";
import { PageResponse } from "../types/customer-booking.type";

export interface GetAdminOrdersParams {
  keyword?: string;
  eventId?: string;
  status?: 'PAID' | 'CANCELED';
  page?: number;
  size?: number;
}

export const adminOrderService = {
  getOrders: async (params: GetAdminOrdersParams): Promise<PageResponse<AdminOrderResponse>> => {
    const response = await axiosClient.get<{ data: PageResponse<AdminOrderResponse> }>("/admin/orders", { params });
    // axios interceptor wraps DataApiResponse, so response.data usually is the DataApiResponse body.
    // Let's verify how the interceptor handles it, but usually standard is response.data
    return response.data;
  },

  getOrderDetail: async (orderId: string): Promise<AdminOrderDetailResponse> => {
    const response = await axiosClient.get<{ data: AdminOrderDetailResponse }>(`/admin/orders/${orderId}`);
    return response.data;
  },
};
