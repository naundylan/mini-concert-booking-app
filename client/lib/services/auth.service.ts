// lib/services/auth.service.ts
import axiosClient from "@/lib/axios";
import { LoginRequest, LoginResponse, OAuth2LoginResponse } from "../types/auth.type";

const getBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return apiUrl.replace(/\/api\/v?\d*\/?$/, '');
};

export const authService = {
  // Backend wrap trong { data: LoginResponse }
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosClient.post<{ data: LoginResponse }>("/auth/sign-in", data);
    return response.data; // interceptor đã unwrap AxiosResponse, còn lại { data: LoginResponse }
  },

  getOAuthUrl: (provider: "google" | "facebook") => {
    return `${getBaseUrl()}/oauth2/authorization/${provider}`;
  },

  // Backend trả về OAuth2LoginResponse trực tiếp, không wrap
  completeOAuth2Phone: async (data: {
    email: string;
    fullName: string;
    googleId: string;
    phone: string;
  }): Promise<OAuth2LoginResponse> => {
    const response = await axiosClient.post<{ data: OAuth2LoginResponse }>("/auth/customer/complete-phone", data);
    return response.data; // TypedAxiosClient trả về { data: OAuth2LoginResponse }, lấy .data
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/auth/login";
  }
};