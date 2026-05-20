'use client'

export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER'

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
