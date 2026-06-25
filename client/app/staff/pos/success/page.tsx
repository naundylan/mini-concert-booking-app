'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, Printer, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { posService } from '@/lib/services/pos.service'
import { OrderResponseDTO } from '@/lib/types/pos.type'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)

const paymentMethodLabel = (method: string) => {
  if (method === 'CASH') return 'Tiền mặt'
  if (method === 'BANK_TRANSFER') return 'Chuyển khoản'
  return method
}

function PosSuccessContent() {
  const searchParams = useSearchParams()
  const orderCode = searchParams.get('orderCode') || ''
  const [order, setOrder] = useState<OrderResponseDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderCode) {
        setError('Không tìm thấy mã đơn hàng.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await posService.getOrderByCode(orderCode)
        setOrder(data)
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Không tải được thông tin đơn hàng.')
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderCode])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
        <Loader2 className="mr-3 h-6 w-6 animate-spin text-indigo-600" />
        Đang tải đơn hàng...
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p className="mb-4 text-sm">{error || 'Không tìm thấy đơn hàng.'}</p>
          <Link href="/staff/pos">
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700">Quay lại POS</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="w-full max-w-xl text-center">
        <div className="mb-5 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <CheckCircle2 size={42} />
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-600">Đơn hàng hoàn tất</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{order.orderCode}</h1>

        <Card className="relative mx-auto mt-8 overflow-hidden rounded-3xl border-0 bg-indigo-100 p-0 text-left shadow-sm">
          <div className="grid grid-cols-2 gap-4 p-7">
            <div>
              <p className="text-xs font-medium text-slate-500">Số tiền đã thanh toán</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(Number(order.amountReceived || order.totalAmount))}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Phương thức</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{paymentMethodLabel(order.paymentMethod)}</p>
              <Badge className="mt-2 border border-emerald-200 bg-emerald-50 text-emerald-700">
                {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : order.paymentStatus === 'PENDING' ? 'Chờ xử lý' : order.paymentStatus === 'FAILED' ? 'Thất bại' : order.paymentStatus}
              </Badge>
            </div>
          </div>

          <div className="border-t border-dashed border-indigo-200 p-7">
            <p className="mb-3 text-xs font-medium text-slate-500">Ghế đã xuất vé</p>
            <div className="flex flex-wrap gap-2">
              {order.items.map((item) => (
                <span key={item.id || item.seatId} className="rounded-md bg-white px-3 py-2 text-xs font-bold text-indigo-600">
                  {item.label || item.seatLabel} · {item.ticketClass?.name || item.ticketClassName || 'Hạng vé'} · {formatMoney(Number(item.ticketClass?.price ?? item.price))}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Button className="bg-indigo-600 py-6 text-white hover:bg-indigo-700" onClick={() => window.print()}>
            <Printer className="mr-2 h-5 w-5" />
            In vé
          </Button>
          <Link href="/staff/pos">
            <Button variant="outline" className="w-full py-6">
              <RotateCcw className="mr-2 h-5 w-5" />
              Đơn mới
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PosSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
          <Loader2 className="mr-3 h-6 w-6 animate-spin text-indigo-600" />
          Đang tải đơn hàng...
        </div>
      }
    >
      <PosSuccessContent />
    </Suspense>
  )
}
