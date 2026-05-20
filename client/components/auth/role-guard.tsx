'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDefaultRouteByRole, normalizeRole, UserRole } from '@/lib/auth-client'
import { authService } from '@/lib/services/auth.service'

type RoleGuardProps = {
  allowedRole: UserRole
  children: ReactNode
}

export default function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const router = useRouter()
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    let isMounted = true

    authService
      .getMe()
      .then((session) => {
        if (!isMounted) {
          return
        }

        const role = normalizeRole(session.role || session.userInfo?.role)

        if (role !== allowedRole) {
          router.replace(getDefaultRouteByRole(role) ?? '/auth')
          return
        }

        setIsAllowed(true)
      })
      .catch(() => {
        if (isMounted) {
          router.replace('/auth')
        }
      })

    return () => {
      isMounted = false
    }
  }, [allowedRole, router])

  if (!isAllowed) {
    return null
  }

  return <>{children}</>
}
