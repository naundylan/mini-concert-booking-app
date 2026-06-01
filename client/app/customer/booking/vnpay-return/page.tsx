'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { customerBookingService } from '@/lib/services/customer-booking.service'
import { VnPayReturnResultDTO } from '@/lib/types/customer-booking.type'

const MAX_RETRIES = 8

export default function VnPayReturnPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [result, setResult] = useState<VnPayReturnResultDTO | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  const params = useMemo(() => {
    const entries: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      entries[key] = value
    })
    return entries
  }, [searchParams])

  useEffect(() => {
    let disposed = false
    let retryTimer: number | undefined

    const loadResult = async (nextAttempt: number) => {
      try {
        setError('')
        setAttempt(nextAttempt)
        const data = await customerBookingService.getVnPayReturnResult(params)
        if (disposed) return

        setResult(data)
        if (data.status === 'PAID' && data.orderId && data.eventId) {
          router.replace(
            `/customer/booking/${data.eventId}/success?orderId=${encodeURIComponent(data.orderId)}`
          )
          return
        }

        if (data.status === 'PENDING' && nextAttempt < MAX_RETRIES) {
          retryTimer = window.setTimeout(() => loadResult(nextAttempt + 1), 2500)
        }
      } catch (err: any) {
        if (!disposed) {
          setError(err?.response?.data?.message || 'Không kiểm tra được kết quả thanh toán VNPay.')
        }
      }
    }

    loadResult(1)

    return () => {
      disposed = true
      if (retryTimer) window.clearTimeout(retryTimer)
    }
  }, [params, router])

  const waiting = !error && (!result || result.status === 'PENDING')
  const eventId = result?.eventId
  const paymentSessionId = result?.paymentSessionId

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <Card className="w-full max-w-xl border border-slate-200 bg-white p-6 text-center">
        {waiting ? (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600" />
            <h1 className="mt-4 text-2xl font-bold text-slate-950">Đang xác nhận thanh toán</h1>
            <p className="mt-2 text-sm text-slate-600">
              Hệ thống đang chờ VNPay gửi xác nhận về server. Lần kiểm tra {attempt}/{MAX_RETRIES}.
            </p>
          </>
        ) : result?.status === 'FAILED' || result?.status === 'EXPIRED' || error ? (
          <>
            <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
            <h1 className="mt-4 text-2xl font-bold text-slate-950">Thanh toán chưa hoàn tất</h1>
            <p className="mt-2 text-sm text-slate-600">
              {error || result?.message || 'Giao dịch VNPay không thành công.'}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {eventId && paymentSessionId ? (
                <Link href={`/customer/booking/${eventId}/checkout?paymentSessionId=${paymentSessionId}`}>
                  <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
                    Quay lại thanh toán
                  </Button>
                </Link>
              ) : null}
              <Link href={eventId ? `/customer/booking/${eventId}/seats` : '/customer/events'}>
                <Button variant="outline" className="w-full">
                  Chọn lại ghế
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="mt-4 text-2xl font-bold text-slate-950">Đã nhận kết quả thanh toán</h1>
            <p className="mt-2 text-sm text-slate-600">Đang chuyển sang trang vé của bạn.</p>
          </>
        )}
      </Card>
    </div>
  )
}
