import axiosClient from "@/lib/axios";
import { LoginRequest, LoginResponse, OAuth2LoginResponse } from "../types/auth.type";
import { clearAuthSession } from "@/lib/auth-client";

const getBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return apiUrl.replace(/\/api\/v?\d*\/?$/, '');
};

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosClient.post<{ data: LoginResponse }>("/auth/sign-in", data);
    return response.data;
  },

  getMe: async (): Promise<AuthSessionResponse> => {
    const response = await axiosClient.get<{ data: AuthSessionResponse }>("/auth/me");
    return response.data;
  },

  getOAuthUrl: (provider: "google" | "facebook") => {
    return `${getBaseUrl()}/oauth2/authorization/${provider}`;
  },

  completeOAuth2Phone: async (data: CompletePhoneRequest): Promise<OAuth2LoginResponse> => {
    const response = await axiosClient.post<{ data: OAuth2LoginResponse }>(
      "/auth/customer/complete-phone",
      data
    );
    return response.data;
  },

  logout: () => {
    clearAuthSession();
    window.location.href = "/auth";
  }
};
