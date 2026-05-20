'use client'

export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER'

type SaveAuthSessionInput = {
  accessToken: string
  refreshToken?: string | null
  role?: string | null
  fullName?: string | null
}

export type AuthSession = {
  accessToken: string | null
  refreshToken: string | null
  role: UserRole | null
  fullName: string | null
}

const ROLE_ROUTES: Record<UserRole, string> = {
  ADMIN: '/admin/dashboard',
  STAFF: '/staff/pos',
  CUSTOMER: '/customer/events',
}

export function normalizeRole(role?: string | null): UserRole | null {
  const normalized = role?.trim().toUpperCase()

  if (normalized === 'ADMIN' || normalized === 'STAFF' || normalized === 'CUSTOMER') {
    return normalized
  }

  return null
}

export function getDefaultRouteByRole(role?: string | null): string | null {
  const normalizedRole = normalizeRole(role)
  return normalizedRole ? ROLE_ROUTES[normalizedRole] : null
}

export function saveAuthSession({
  accessToken,
  refreshToken,
  role,
  fullName,
}: SaveAuthSessionInput) {
  const normalizedRole = normalizeRole(role)

  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken ?? '')

  if (normalizedRole) {
    localStorage.setItem('userRole', normalizedRole)
  } else {
    localStorage.removeItem('userRole')
  }

  if (fullName) {
    localStorage.setItem('userFullName', fullName)
  } else {
    localStorage.removeItem('userFullName')
  }
}

export function clearAuthSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userRole')
  localStorage.removeItem('userFullName')
}

export function getAuthSession(): AuthSession {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    role: normalizeRole(localStorage.getItem('userRole')),
    fullName: localStorage.getItem('userFullName'),
  }
}
