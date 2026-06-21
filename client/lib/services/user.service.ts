import axiosClient from "@/lib/axios";
import {
  User,
  CreateStaffRequest,
  UpdateStaffRequest,
  UpdateStaffStatusRequest,
  ResetStaffPasswordRequest,
} from "../types/user.type";

export const userService = {
  getAllStaff: async (): Promise<User[]> => {
    const response = await axiosClient.get<{ data: User[] }>("/users/staff");
    return response.data;
  },

  createStaff: async (data: CreateStaffRequest): Promise<User> => {
    const response = await axiosClient.post<{ data: User }>("/users/staff", data);
    return response.data;
  },

  updateStaff: async (id: string, data: UpdateStaffRequest): Promise<User> => {
    const response = await axiosClient.put<{ data: User }>(`/users/staff/${id}`, data);
    return response.data;
  },

  updateStaffStatus: async (id: string, data: UpdateStaffStatusRequest): Promise<void> => {
    await axiosClient.put(`/users/staff/${id}/status`, data);
  },

  resetStaffPassword: async (id: string, data: ResetStaffPasswordRequest): Promise<void> => {
    await axiosClient.put(`/users/staff/${id}/reset-password`, data);
  },
};
