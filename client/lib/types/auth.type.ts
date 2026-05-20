export interface UserInfo {
  email: string | null
  phone: string | null
  fullName: string | null
  googleId: string | null
  role: string
  status: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthSessionResponse {
  role: string
  userInfo?: UserInfo | null
}

export type LoginResponse = AuthSessionResponse
export type OAuth2LoginResponse = AuthSessionResponse

export interface CompletePhoneRequest {
  email: string
  fullName: string
  googleId: string
  phone: string
}
