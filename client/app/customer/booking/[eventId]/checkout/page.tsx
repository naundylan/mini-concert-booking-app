'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, CheckCircle, ChevronLeft, Clock, Copy, CreditCard, Loader2, Landmark, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { authService } from '@/lib/services/auth.service'
import { customerBookingService } from '@/lib/services/customer-booking.service'
import { CheckoutSessionDTO, VietQrPaymentDTO } from '@/lib/types/customer-booking.type'
import { UserInfo } from '@/lib/types/auth.type'
import { useCountdown } from '@/lib/hooks/useCountdown'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)

const selectedSeatStorageKey = (eventId: string) => `customer:selectedSeats:${eventId}`
const checkoutSessionStorageKey = (eventId: string) => `customer:checkoutSession:${eventId}`

const getApiErrorMessage = (err: any) => {
  const body = err?.response?.data
  return body?.message || 'Không thể tạo phiên thanh toán. Vui lòng thử lại.'
}

const getApiErrorCode = (err: any) => err?.response?.data?.error || err?.response?.data?.code

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = String(params.eventId || '')
  const querySessionId = searchParams.get('paymentSessionId')
  const initializedRef = useRef(false)

  const [session, setSession] = useState<CheckoutSessionDTO | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [vietQrPayment, setVietQrPayment] = useState<VietQrPaymentDTO | null>(null)
  const [waitingVietQr, setWaitingVietQr] = useState(false)

  const countdown = useCountdown(session?.expiresAt)

  const redirectToSeats = useCallback(
    (message?: string) => {
      const url = `/customer/booking/${eventId}/seats${message ? `?message=${encodeURIComponent(message)}` : ''}`
      router.replace(url)
    },
    [eventId, router]
  )

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const me = await authService.getMe()
        setUserInfo(me.userInfo || null)
      } catch {
        setUserInfo(null)
      }
    }
    loadCustomer()
  }, [])

  useEffect(() => {
    if (!eventId || initializedRef.current) return
    initializedRef.current = true

    const initCheckout = async () => {
      try {
        setLoading(true)
        setError('')

        if (querySessionId) {
          const restored = await customerBookingService.getCheckoutSession(querySessionId)
          setSession(restored)
          window.sessionStorage.setItem(checkoutSessionStorageKey(eventId), restored.paymentSessionId)
          return
        }

        const rawSeatIds = window.sessionStorage.getItem(selectedSeatStorageKey(eventId))
        const seatIds = rawSeatIds ? (JSON.parse(rawSeatIds) as string[]) : []
        const uniqueSeatIds = Array.from(new Set(seatIds)).filter(Boolean)
        if (uniqueSeatIds.length === 0) {
          redirectToSeats('Vui lòng chọn ghế trước khi thanh toán.')
          return
        }

        const created = await customerBookingService.createCheckout({
          eventId,
          seatIds: uniqueSeatIds,
          paymentMethod: 'BANK_TRANSFER',
        })
        setSession(created)
        window.sessionStorage.setItem(checkoutSessionStorageKey(eventId), created.paymentSessionId)
        router.replace(
          `/customer/booking/${eventId}/checkout?paymentSessionId=${encodeURIComponent(
            created.paymentSessionId
          )}`
        )
      } catch (err: any) {
        if (err?.response?.status === 409) {
          window.sessionStorage.removeItem(selectedSeatStorageKey(eventId))
          redirectToSeats('Một số ghế vừa được người khác giữ hoặc mua. Vui lòng chọn lại.')
          return
        }
        if (err?.response?.status === 410 || getApiErrorCode(err) === 'SESSION_EXPIRED') {
          window.sessionStorage.removeItem(checkoutSessionStorageKey(eventId))
          redirectToSeats('Phiên thanh toán đã hết hạn. Vui lòng chọn ghế lại.')
          return
        }
        setError(getApiErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    initCheckout()
  }, [eventId, querySessionId, redirectToSeats, router])

  useEffect(() => {
    if (!session || !countdown.isExpired) return
    customerBookingService.releaseCheckout(session.paymentSessionId).catch(() => undefined)
    window.sessionStorage.removeItem(checkoutSessionStorageKey(eventId))
    window.sessionStorage.removeItem(selectedSeatStorageKey(eventId))
    redirectToSeats('Phiên thanh toán đã hết hạn. Vui lòng chọn ghế lại.')
  }, [countdown.isExpired, eventId, redirectToSeats, session])

  useEffect(() => {
    if (!session || !waitingVietQr || countdown.isExpired) return

    const timer = window.setInterval(async () => {
      try {
        const status = await customerBookingService.getCheckoutPaymentStatus(session.paymentSessionId)
        if (status.status === 'PAID' && status.orderId) {
          window.clearInterval(timer)
          window.sessionStorage.removeItem(checkoutSessionStorageKey(eventId))
          window.sessionStorage.removeItem(selectedSeatStorageKey(eventId))
          router.replace(`/customer/booking/${eventId}/success?orderId=${encodeURIComponent(status.orderId)}`)
        }
        if (status.status === 'EXPIRED' || status.status === 'FAILED') {
          window.clearInterval(timer)
          setWaitingVietQr(false)
          setError(
            status.status === 'EXPIRED'
              ? 'Phiên thanh toán đã hết hạn. Vui lòng chọn ghế lại.'
              : 'Thanh toán VietQR chưa hoàn tất. Vui lòng kiểm tra lại giao dịch.'
          )
        }
      } catch {
        // Keep polling; temporary network errors should not break the waiting state.
      }
    }, 3000)

    return () => window.clearInterval(timer)
  }, [countdown.isExpired, eventId, router, session, waitingVietQr])

  const backToSeats = () => {
    router.replace(`/customer/booking/${eventId}/seats`)
  }

  const cancelCheckout = async () => {
    window.sessionStorage.removeItem(checkoutSessionStorageKey(eventId))
    router.replace(`/customer/booking/${eventId}/seats`)
  }

  const confirmDev = async () => {
    if (!session) return
    try {
      setSubmitting(true)
      setError('')
      const order = await customerBookingService.confirmDevPayment(session.paymentSessionId)
      window.sessionStorage.removeItem(checkoutSessionStorageKey(eventId))
      window.sessionStorage.removeItem(selectedSeatStorageKey(eventId))
      router.replace(`/customer/booking/${eventId}/success?orderId=${encodeURIComponent(order.orderId)}`)
    } catch (err: any) {
      setError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const payWithVnPay = async () => {
    if (!session) return
    try {
      setSubmitting(true)
      setError('')
      const result = await customerBookingService.createVnPayPayment(session.paymentSessionId)
      window.location.href = result.paymentUrl
    } catch (err: any) {
      setError(getApiErrorMessage(err))
      setSubmitting(false)
    }
  }

  const payWithVietQr = async () => {
    if (!session) return
    try {
      setSubmitting(true)
      setError('')
      const result = await customerBookingService.createVietQrPayment(session.paymentSessionId)
      setVietQrPayment(result)
      setWaitingVietQr(true)
    } catch (err: any) {
      setError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Ignore unsupported clipboard API.
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm text-slate-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" />
        Đang tạo phiên thanh toán...
      </div>
    )
  }

  if (!session) {
    return (
      <div className="space-y-4 p-6 lg:p-8">
        <Link href={`/customer/booking/${eventId}/seats`} className="inline-flex items-center gap-2 text-sm text-indigo-600">
          <ChevronLeft size={16} />
          Quay lại chọn ghế
        </Link>
        <Card className="border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button onClick={backToSeats} className="mb-3 inline-flex items-center gap-2 text-sm text-indigo-600">
            <ChevronLeft size={16} />
            Quay lại chọn ghế
          </button>
          <h1 className="text-3xl font-bold text-slate-950">Thanh toán chuyển khoản</h1>
          <p className="mt-1 text-sm text-slate-600">
            Ghế đang được giữ trong 10 phút. Hoàn tất thanh toán trước khi phiên hết hạn.
          </p>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-indigo-700">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock size={18} />
            Còn lại
          </div>
          <p className={`mt-1 font-mono text-3xl font-bold ${countdown.secondsLeft <= 120 ? 'text-red-600' : ''}`}>
            {countdown.formatted}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-950">Thông tin khách hàng</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Họ tên</p>
                <p className="mt-1 font-semibold text-slate-900">{userInfo?.fullName || '--'}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Số điện thoại</p>
                <p className="mt-1 font-semibold text-slate-900">{userInfo?.phone || '--'}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Email</p>
                <p className="mt-1 font-semibold text-slate-900">{userInfo?.email || '--'}</p>
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <Landmark size={20} className="text-indigo-600" />
              Thông tin chuyển khoản
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ['Số tài khoản', session.bankTransferInfo.accountNumber],
                ['Tên tài khoản', session.bankTransferInfo.accountName],
                ['Số tiền', formatMoney(session.bankTransferInfo.amount)],
                ['Nội dung', session.bankTransferInfo.content],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">{label}</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="break-all font-semibold text-slate-950">{value}</p>
                    <button type="button" className="text-indigo-600" onClick={() => copyText(value)}>
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              V1 đang dùng chuyển khoản/dev confirm. Khi tích hợp VNPay thật, webhook sẽ thay bước xác nhận demo.
            </div>
          </Card>

          {vietQrPayment && (
            <Card className="border border-slate-200 bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                <QrCode size={20} className="text-indigo-600" />
                Thanh toán VietQR
              </h2>

              <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <img
                    src={vietQrPayment.qrUrl}
                    alt="Mã QR thanh toán VietQR"
                    className="aspect-square w-full rounded-lg object-contain"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['Ngân hàng', vietQrPayment.bankId],
                    ['Số tài khoản', vietQrPayment.accountNo],
                    ['Tên tài khoản', vietQrPayment.accountName],
                    ['Số tiền', formatMoney(vietQrPayment.amount)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">{label}</p>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <p className="break-all font-semibold text-slate-950">{value}</p>
                        <button type="button" className="text-indigo-600" onClick={() => copyText(value)}>
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase text-amber-700">Nội dung bắt buộc</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="break-all text-xl font-bold text-amber-900">{vietQrPayment.content}</p>
                      <button
                        type="button"
                        className="text-indigo-600"
                        onClick={() => copyText(vietQrPayment.content)}
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-amber-800">
                      Chuyển khoản sai nội dung có thể khiến hệ thống không tự xác nhận vé.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-2 rounded-lg bg-indigo-50 p-4 text-sm text-indigo-800">
                <Clock size={18} className="mt-0.5 flex-shrink-0" />
                {waitingVietQr
                  ? 'Đang chờ SePay xác nhận tiền vào. Trang sẽ tự chuyển khi thanh toán thành công.'
                  : 'Quét mã QR hoặc chuyển khoản đúng số tiền và nội dung để hệ thống tự xác nhận.'}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-950">Vé đã giữ</h2>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
              {session.selectedSeats.map((seat) => (
                <div key={seat.id} className="rounded-lg bg-indigo-50 p-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">Ghế {seat.label}</p>
                      <p className="text-xs text-slate-600">{seat.ticketClassName}</p>
                    </div>
                    <p className="font-semibold text-indigo-700">{formatMoney(seat.price)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-sm font-medium text-slate-600">Tổng thanh toán</span>
              <span className="text-2xl font-bold text-indigo-600">{formatMoney(session.totalAmount)}</span>
            </div>
          </Card>

          <Button
              className="w-full bg-slate-950 text-white hover:bg-slate-800"
              onClick={payWithVietQr}
              disabled={submitting || countdown.isExpired || waitingVietQr}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang tạo mã VietQR...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-5 w-5" />
                  Thanh toán qua VietQR
                </>
              )}
          </Button>

          <Button
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={payWithVnPay}
              disabled={submitting || countdown.isExpired}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang chuyển sang VNPay...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Thanh toán qua VNPay
                </>
              )}
          </Button>

          <Button
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={confirmDev}
              disabled={submitting || countdown.isExpired}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang xác nhận...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Tôi đã chuyển khoản
                </>
              )}
          </Button>

          <Button variant="outline" className="w-full" onClick={cancelCheckout} disabled={submitting}>
            Rời phiên, giữ ghế đến hết giờ
          </Button>
        </div>
      </div>
    </div>
  )
}
