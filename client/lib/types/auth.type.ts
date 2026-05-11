// types/auth.type.ts

/** Tương ứng với class UserInfo trong Java */
export interface UserInfo {
  email: string;
  phone: string | null;
  fullName: string;
  googleId: string;
  role: string;
  status: string;
}

/** Tương ứng với SignInDTO.java */
export interface LoginRequest {
  username: string;
  password: string;
}

/** Tương ứng với TokenDTO.java */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiration: number;
  refreshTokenExpiration: number;
  role: string;
  userInfo?: {
    fullName? : string,
    role?: string,
  }
}

/** Tương ứng với OAuth2LoginDTO.java */
export interface OAuth2LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiration: number;
  refreshTokenExpiration: number;
  userInfo: UserInfo;
}

/** Request để hoàn tất profile sau OAuth2 */
export interface CompletePhoneRequest {
  email: string;
  fullName: string;
  googleId: string;
  phone: string;
}