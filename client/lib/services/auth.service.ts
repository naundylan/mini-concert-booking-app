import axiosClient from "@/lib/axios";
import {
  AuthSessionResponse,
  CompletePhoneRequest,
  LoginRequest,
  LoginResponse,
  OAuth2LoginResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "../types/auth.type";

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

  logout: async () => {
    try {
      await axiosClient.post("/auth/sign-out");
    } finally {
      window.location.href = "/auth";
    }
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await axiosClient.post("/auth/change-password", data);
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await axiosClient.post("/auth/forgot-password", data);
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await axiosClient.post("/auth/reset-password", data);
  }
};
