'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthSession, getDefaultRouteByRole, UserRole } from '@/lib/auth-client'

type RoleGuardProps = {
  allowedRole: UserRole
  children: ReactNode
}

export default function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const router = useRouter()
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    const session = getAuthSession()

    if (!session.accessToken) {
      router.replace('/auth')
      return
    }

    if (session.role !== allowedRole) {
      router.replace(getDefaultRouteByRole(session.role) ?? '/auth')
      return
    }

    setIsAllowed(true)
  }, [allowedRole, router])

  if (!isAllowed) {
    return null
  }

  return <>{children}</>
}
