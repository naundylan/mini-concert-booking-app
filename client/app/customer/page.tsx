'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function CustomerHomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/customer/events')
  }, [router])

  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-600">
      <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" />
      Đang chuyển đến danh sách sự kiện...
    </div>
  )
}
