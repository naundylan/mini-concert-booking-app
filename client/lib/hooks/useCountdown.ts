'use client'

import { useEffect, useMemo, useState } from 'react'

export const useCountdown = (expiresAt?: string | null) => {
  const targetTime = useMemo(() => {
    if (!expiresAt) return null
    const parsed = new Date(expiresAt).getTime()
    return Number.isNaN(parsed) ? null : parsed
  }, [expiresAt])

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!targetTime) return

    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [targetTime])

  const secondsLeft = targetTime ? Math.max(0, Math.ceil((targetTime - now) / 1000)) : 0
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  return {
    secondsLeft,
    isExpired: Boolean(targetTime && secondsLeft <= 0),
    formatted: `${minutes}:${seconds.toString().padStart(2, '0')}`,
  }
}
