'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LegacyConfirmationRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = String(params.eventId || '')

  useEffect(() => {
    router.replace(`/customer/booking/${eventId}/checkout`)
  }, [eventId, router])

  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-600">
      <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" />
      Đang chuyển sang trang thanh toán...
    </div>
  )
}
