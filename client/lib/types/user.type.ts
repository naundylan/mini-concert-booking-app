export interface User {
  id: string;
  phone: string | null;
  username: string | null;
  email: string | null;
  fullName: string;
  role: string;
  status: string;
}

export interface CreateStaffRequest {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  username: string;
  password?: string | null;
}

export interface UpdateStaffRequest {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  username: string;
}

export interface UpdateStaffStatusRequest {
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ResetStaffPasswordRequest {
  newPassword?: string;
}
