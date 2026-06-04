'use client'

import { useEffect, useRef, useState } from 'react'
import {
  SeatChangedEvent,
  SeatHeldEvent,
  SeatSnapshotEvent,
} from '@/lib/types/customer-booking.type'

interface UseSeatsSocketOptions {
  eventId?: string
  enabled?: boolean
  onSnapshot?: (event: SeatSnapshotEvent) => void
  onSeatHeld?: (event: SeatHeldEvent) => void
  onSeatReleased?: (event: SeatChangedEvent) => void
  onSeatSold?: (event: SeatChangedEvent) => void
  onReconnect?: () => void
}

export const useSeatsSocket = ({
  eventId,
  enabled = true,
  onSnapshot,
  onSeatHeld,
  onSeatReleased,
  onSeatSold,
  onReconnect,
}: UseSeatsSocketOptions) => {
  const handlersRef = useRef({
    onSnapshot,
    onSeatHeld,
    onSeatReleased,
    onSeatSold,
    onReconnect,
  })
  const [connected, setConnected] = useState(false)

  handlersRef.current = {
    onSnapshot,
    onSeatHeld,
    onSeatReleased,
    onSeatSold,
    onReconnect,
  }

  useEffect(() => {
    if (!enabled || !eventId) return

    let disposed = false
    let socket: any = null

    const connect = async () => {
      try {
        const dynamicImport = new Function('specifier', 'return import(specifier)') as (
          specifier: string
        ) => Promise<any>
        const mod = await dynamicImport('socket.io-client')
        if (disposed) return

        const io = mod.io || mod.default
        const socketUrl =
          process.env.NEXT_PUBLIC_SOCKET_URL ||
          (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1').replace(
            /\/api\/v?\d*\/?$/,
            ''
          )

        socket = io(socketUrl, {
          withCredentials: true,
          transports: ['websocket'],
        })

        socket.on('connect', () => {
          setConnected(true)
          socket.emit('join-event', { eventId })
        })
        socket.on('disconnect', () => setConnected(false))
        socket.io?.on?.('reconnect', () => {
          handlersRef.current.onReconnect?.()
          socket.emit('join-event', { eventId })
        })
        socket.on('seat-snapshot', (event: SeatSnapshotEvent) => handlersRef.current.onSnapshot?.(event))
        socket.on('seat-held', (event: SeatHeldEvent) => handlersRef.current.onSeatHeld?.(event))
        socket.on('seat-released', (event: SeatChangedEvent) =>
          handlersRef.current.onSeatReleased?.(event)
        )
        socket.on('seat-sold', (event: SeatChangedEvent) => handlersRef.current.onSeatSold?.(event))
      } catch {
        setConnected(false)
      }
    }

    connect()

    const handleOnline = () => handlersRef.current.onReconnect?.()
    window.addEventListener('online', handleOnline)

    return () => {
      disposed = true
      window.removeEventListener('online', handleOnline)
      socket?.disconnect?.()
    }
  }, [enabled, eventId])

  return { connected }
}
