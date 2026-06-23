import axiosClient from "@/lib/axios";

export interface ChartPoint {
  date: string;
  sales: number;
  highlight: boolean;
}

export interface AdminDashboardStats {
  totalRevenue: number;
  totalRevenueChange: number;
  ticketsSold: number;
  ticketsSoldChange: number;
  activeEventsCount: number;
  checkInRate: number;
  chartData: ChartPoint[];
}

export const adminDashboardService = {
  getStats: async (timeRange: number = 30): Promise<AdminDashboardStats> => {
    const response = await axiosClient.get<{ data: AdminDashboardStats }>("/admin/dashboard/stats", {
      params: { timeRange },
    });
    return response.data;
  },
};
