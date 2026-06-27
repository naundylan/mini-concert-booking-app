'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, ChevronLeft, Loader2, RefreshCw, Ticket } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { customerBookingService } from '@/lib/services/customer-booking.service'
import { CustomerSeatCatalogDTO, CustomerSeatDTO } from '@/lib/types/customer-booking.type'
import { useSeatsSocket } from '@/lib/hooks/useSeatsSocket'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)

const getApiErrorMessage = (err: any) =>
  err?.response?.data?.message || 'Không tải được sơ đồ ghế. Vui lòng thử lại.'

const selectedSeatStorageKey = (eventId: string) => `customer:selectedSeats:${eventId}`

export default function SeatSelectionPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = String(params.eventId || '')

  const [catalog, setCatalog] = useState<CustomerSeatCatalogDTO | null>(null)
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await customerBookingService.getCatalog(eventId)
      setCatalog(data)
      setSelectedSeatIds((current) =>
        current.filter((seatId) => data.seats.some((seat) => seat.id === seatId && seat.status === 'AVAILABLE'))
      )
    } catch (err: any) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    if (eventId) loadCatalog()
  }, [eventId, loadCatalog])

  const patchSeatStatus = useCallback((seatIds: string[], status: CustomerSeatDTO['status']) => {
    setCatalog((current) => {
      if (!current) return current
      const seatIdSet = new Set(seatIds)
      return {
        ...current,
        seats: current.seats.map((seat) => (seatIdSet.has(seat.id) ? { ...seat, status } : seat)),
      }
    })
    setSelectedSeatIds((current) => current.filter((seatId) => !seatIds.includes(seatId)))
  }, [])

  const applySeatSnapshot = useCallback((heldSeatIds: string[], soldSeatIds: string[]) => {
    setCatalog((current) => {
      if (!current) return current
      const heldSeatIdSet = new Set(heldSeatIds)
      const soldSeatIdSet = new Set(soldSeatIds)
      return {
        ...current,
        seats: current.seats.map((seat) => {
          if (soldSeatIdSet.has(seat.id)) return { ...seat, status: 'SOLD' }
          if (heldSeatIdSet.has(seat.id)) return { ...seat, status: 'HELD' }
          if (seat.status === 'HELD') return { ...seat, status: 'AVAILABLE' }
          return seat
        }),
      }
    })
    setSelectedSeatIds((current) =>
      current.filter((seatId) => !heldSeatIds.includes(seatId) && !soldSeatIds.includes(seatId))
    )
  }, [])

  useSeatsSocket({
    eventId,
    onSnapshot: (snapshot) => {
      applySeatSnapshot(snapshot.heldSeatIds, snapshot.soldSeatIds)
    },
    onSeatHeld: (event) => {
      patchSeatStatus(event.seatIds, 'HELD')
      setNotice('Một số ghế vừa được khách khác giữ. Danh sách chọn đã được cập nhật.')
    },
    onSeatReleased: (event) => patchSeatStatus(event.seatIds, 'AVAILABLE'),
    onSeatSold: (event) => {
      patchSeatStatus(event.seatIds, 'SOLD')
      setNotice('Một số ghế vừa được bán. Danh sách chọn đã được cập nhật.')
    },
    onReconnect: loadCatalog,
  })

  const parseSeatLabel = (label: string) => {
    if (!label) return { row: '1', seat: '1' }
    if (label.includes('-')) {
      const parts = label.split('-')
      return { row: parts[0], seat: parts[1] }
    }
    const match = label.match(/^([A-Z]+)(\d+)$/i)
    if (match) {
      return { row: match[1], seat: match[2] }
    }
    return { row: '1', seat: label }
  }

  const seatBounds = useMemo(() => {
    if (!catalog || catalog.seats.length === 0) return { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 }
    const seatRows = catalog.seats.map((seat) => seat.gridRow ?? 0)
    const seatCols = catalog.seats.map((seat) => seat.gridColumn ?? 0)

    const decRows = (catalog.layoutDecorations || []).map((d) => d.row)
    const decRowsMax = (catalog.layoutDecorations || []).map((d) => d.row + d.rowSpan - 1)
    const decCols = (catalog.layoutDecorations || []).map((d) => d.col)
    const decColsMax = (catalog.layoutDecorations || []).map((d) => d.col + d.colSpan - 1)

    const allRows = [...seatRows, ...decRows, ...decRowsMax]
    const allCols = [...seatCols, ...decCols, ...decColsMax]

    return {
      minRow: Math.min(...allRows),
      maxRow: Math.max(...allRows),
      minCol: Math.min(...allCols),
      maxCol: Math.max(...allCols),
    }
  }, [catalog])

  const activeRows = useMemo(() => {
    if (!catalog) return []
    const rowsMap = new Map<number, string>()
    for (const seat of catalog.seats) {
      const rowNum = seat.gridRow ?? 0
      if (!rowsMap.has(rowNum)) {
        rowsMap.set(rowNum, parseSeatLabel(seat.label).row)
      }
    }
    return Array.from(rowsMap.entries()).sort(([a], [b]) => a - b)
  }, [catalog])

  const selectedSeats = useMemo(() => {
    if (!catalog) return []
    return catalog.seats.filter((seat) => selectedSeatIds.includes(seat.id))
  }, [catalog, selectedSeatIds])

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + Number(seat.price || 0), 0)

  const toggleSeat = (seat: CustomerSeatDTO) => {
    if (seat.status !== 'AVAILABLE') return
    setError('')
    setNotice('')
    setSelectedSeatIds((current) => {
      if (current.includes(seat.id)) return current.filter((id) => id !== seat.id)
      if (current.length >= 10) {
        setNotice('Bạn chỉ được chọn tối đa 10 ghế mỗi lần đặt.')
        return current
      }
      return [...current, seat.id]
    })
  }

  const goToCheckout = () => {
    if (selectedSeatIds.length === 0) return
    window.sessionStorage.setItem(selectedSeatStorageKey(eventId), JSON.stringify(selectedSeatIds))
    router.push(`/customer/booking/${eventId}/checkout`)
  }

  const getSeatClassName = (seat: CustomerSeatDTO) => {
    const selected = selectedSeatIds.includes(seat.id)
    if (selected) return 'bg-amber-300 text-slate-950 ring-2 ring-amber-500'
    if (seat.status === 'SOLD') return 'bg-slate-300 text-slate-500 cursor-not-allowed'
    if (seat.status === 'HELD') return 'bg-orange-200 text-orange-900 cursor-not-allowed'
    if (seat.status === 'LOCKED' || seat.status === 'MAINTENANCE') {
      return 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
    }
    return 'text-white hover:brightness-95'
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href={`/customer/events/${eventId}`}
            className="mb-3 inline-flex items-center gap-2 text-sm text-indigo-600"
          >
            <ChevronLeft size={16} />
            Quay lại chi tiết sự kiện
          </Link>
          <h1 className="text-3xl font-bold text-slate-950">{catalog?.eventName || 'Chọn ghế'}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Chọn ghế ở bước này chỉ là lựa chọn trên giao diện. Ghế chỉ được giữ thật khi bạn bấm thanh toán.
          </p>
        </div>

        <Button variant="outline" onClick={loadCatalog}>
          <RefreshCw size={16} className="mr-2" />
          Tải lại sơ đồ
        </Button>
      </div>

      {(error || notice) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            error ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {error || notice}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-slate-600">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" />
          Đang tải sơ đồ ghế...
        </div>
      ) : !catalog ? (
        <Card className="border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
          Không có dữ liệu sơ đồ ghế.
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card className="border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-indigo-600" /> Có thể chọn</span>
              <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-amber-300" /> Đang chọn</span>
              <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-orange-200" /> Đang giữ</span>
              <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-slate-300" /> Đã bán</span>
              <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-zinc-200" /> Không mở</span>
            </div>

             {!catalog || catalog.seats.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500">
                Sự kiện này chưa có ghế để bán.
              </div>
            ) : (
              <div className="overflow-auto rounded-xl bg-slate-100 p-6 shadow-inner">
                {/* Fallback stage ở phía trên nếu không có decorations (layout cũ) */}
                {(!catalog.layoutDecorations || catalog.layoutDecorations.length === 0) && (
                  <div className="mb-6 rounded-b-full border-b-8 border-indigo-200 py-3 text-center text-xs font-bold tracking-[0.25em] text-slate-500">
                    SÂN KHẤU
                  </div>
                )}

                <div className="relative" style={{
                  width: `${(seatBounds.maxCol - seatBounds.minCol + 1) * 38 + 80}px`,
                  height: `${(seatBounds.maxRow - seatBounds.minRow + 1) * 38 + (!catalog.layoutDecorations || catalog.layoutDecorations.length === 0 ? 60 : 0)}px`
                }}>
                  {/* Hàng ghế nhãn trái */}
                  {activeRows.map(([gridRow, rowLabel]) => {
                    const topOffset = !catalog.layoutDecorations || catalog.layoutDecorations.length === 0 ? 60 : 0
                    return (
                      <span
                        key={`row-label-${gridRow}`}
                        style={{
                          position: 'absolute',
                          left: '0px',
                          top: `${(gridRow - seatBounds.minRow) * 38 + topOffset}px`,
                          width: '64px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                        }}
                        className="text-xs font-bold text-slate-500 select-none"
                      >
                        Hàng {rowLabel}
                      </span>
                    )
                  })}

                  {/* Decorations sân khấu */}
                  {(catalog.layoutDecorations || []).map((dec) => (
                    <div
                      key={`dec-${dec.id}`}
                      style={{
                        position: 'absolute',
                        left: `${(dec.col - seatBounds.minCol) * 38 + 80}px`,
                        top: `${(dec.row - seatBounds.minRow) * 38}px`,
                        width: `${dec.colSpan * 38 - 6}px`,
                        height: `${dec.rowSpan * 38 - 6}px`,
                        borderRadius: dec.shape === 'ellipse' ? '50%' : '8px',
                      }}
                      className="absolute flex items-center justify-center bg-slate-900 border-2 border-amber-500 text-slate-100 font-bold text-[11px] shadow-md opacity-90 select-none"
                    >
                      {dec.label}
                    </div>
                  ))}

                  {/* Ghế ngồi */}
                  {catalog.seats.map((seat) => {
                    const normalizedCol = (seat.gridColumn ?? 0) - seatBounds.minCol
                    const normalizedRow = (seat.gridRow ?? 0) - seatBounds.minRow
                    const topOffset = !catalog.layoutDecorations || catalog.layoutDecorations.length === 0 ? 60 : 0
                    const seatLabelText = seat.label
                    const isLongLabel = seatLabelText.length >= 4
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        onClick={() => toggleSeat(seat)}
                        disabled={seat.status !== 'AVAILABLE'}
                        title={`${seatLabelText} - ${seat.ticketClassName} - ${formatMoney(seat.price)}`}
                        style={{
                          position: 'absolute',
                          left: `${normalizedCol * 38 + 80}px`,
                          top: `${normalizedRow * 38 + topOffset}px`,
                          width: '32px',
                          height: '32px',
                          ...(seat.status === 'AVAILABLE' && !selectedSeatIds.includes(seat.id)
                            ? { backgroundColor: seat.colorCode || '#4f46e5' }
                            : {})
                        }}
                        className={`rounded-md font-bold transition flex items-center justify-center ${isLongLabel ? 'text-[8px]' : 'text-[10px]'} ${getSeatClassName(seat)}`}
                      >
                        {seatLabelText}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <Card className="sticky top-6 border border-slate-200 bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                <Ticket size={20} className="text-indigo-600" />
                Vé đã chọn
              </h2>

              <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                {selectedSeats.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                    Chưa chọn ghế nào.
                  </p>
                ) : (
                  selectedSeats.map((seat) => (
                    <div key={seat.id} className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">Ghế {seat.label}</p>
                          <p className="text-xs text-slate-600">{seat.ticketClassName}</p>
                        </div>
                        <Badge className="bg-white text-indigo-700">{formatMoney(seat.price)}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-sm font-medium text-slate-600">Tổng tiền</span>
                <span className="text-2xl font-bold text-indigo-600">{formatMoney(totalAmount)}</span>
              </div>

              <Button
                className="mt-5 w-full bg-indigo-600 text-white hover:bg-indigo-700"
                disabled={selectedSeatIds.length === 0}
                onClick={goToCheckout}
              >
                Tiến hành thanh toán
              </Button>

              <div className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                Ghế chỉ được giữ 10 phút sau khi vào màn hình thanh toán.
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
