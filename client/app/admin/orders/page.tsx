'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, User, Phone, Mail, ShoppingBag, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { adminOrderService } from '@/lib/services/admin-order.service';
import { eventService } from '@/lib/services/event.service';
import { AdminOrderResponse, AdminOrderDetailResponse } from '@/lib/types/admin-order.type';
import { Event } from '@/lib/types/event.type';
import { PageResponse } from '@/lib/types/customer-booking.type';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminOrdersPage() {
  const [ordersPage, setOrdersPage] = useState<PageResponse<AdminOrderResponse> | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  
  // Filters
  const [keyword, setKeyword] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PAID' | 'CANCELED'>('ALL');
  const [page, setPage] = useState(0);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Order Detail Modal
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [orderDetail, setOrderDetail] = useState<AdminOrderDetailResponse | null>(null);

  // Load events for filter
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await eventService.getAll();
        setEvents(res.data || []);
      } catch (err: any) {
        console.error('Failed to load events', err);
      }
    };
    loadEvents();
  }, []);

  // Fetch orders when filters change
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await adminOrderService.getOrders({
        keyword: keyword.trim() || undefined,
        eventId: selectedEventId === 'ALL' ? undefined : selectedEventId,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        page,
        size: 10,
      });
      setOrdersPage(res);
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err?.response?.data?.message || 'Không thể tải danh sách đơn hàng.',
        variant: 'destructive',
      });
      setOrdersPage(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, selectedEventId, selectedStatus, page]);

  const viewOrderDetail = async (orderId: string) => {
    setLoadingDetail(true);
    setOrderDetail(null);
    setShowDetailDialog(true);
    try {
      const detail = await adminOrderService.getOrderDetail(orderId);
      setOrderDetail(detail);
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err?.response?.data?.message || 'Không thể tải chi tiết đơn hàng.',
        variant: 'destructive',
      });
      setShowDetailDialog(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    if (status === 'PAID') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getChannelBadgeStyle = (channel: string) => {
    if (channel === 'POS') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const translateOrderStatus = (status: string) => {
    switch (status) {
      case 'PAID': return 'Đã thanh toán';
      case 'CANCELED': return 'Đã hủy';
      default: return status;
    }
  };

  const translateOrderChannel = (channel: string) => {
    switch (channel) {
      case 'POS': return 'Tại quầy';
      case 'ONLINE': return 'Trực tuyến';
      default: return channel;
    }
  };

  const orders = ordersPage?.content || [];
  const totalPages = ordersPage?.totalPages || 0;
  const totalElements = ordersPage?.totalElements || 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Quản lý Đơn hàng</h1>
        <p className="text-slate-600 text-sm mt-1">Tra cứu chi tiết danh sách vé bán trực tuyến và tại quầy POS</p>
      </div>

      {/* Separator */}
      <div className="h-px bg-indigo-200"></div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            placeholder="Tìm theo mã đơn, khách hàng, số điện thoại..."
            className="pl-10 text-sm border-slate-200"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setPage(0);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-56"
            >
              <option value="ALL">Tất cả sự kiện</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                setPage(0);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-44"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="CANCELED">Bị hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table Container */}
      <Card className="border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-sm">Đang tải dữ liệu đơn hàng...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 text-slate-500 bg-white">
              <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm">Không tìm thấy đơn hàng nào khớp với tìm kiếm.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <th className="py-4 px-6">Mã đơn</th>
                  <th className="py-4 px-6">Khách hàng</th>
                  <th className="py-4 px-6">Sự kiện</th>
                  <th className="py-4 px-6 text-center">Số vé</th>
                  <th className="py-4 px-6 text-right">Tổng tiền</th>
                  <th className="py-4 px-6 text-center">Kênh bán</th>
                  <th className="py-4 px-6 text-center">Trạng thái</th>
                  <th className="py-4 px-6 text-center">Ngày lập</th>
                  <th className="py-4 px-6 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-indigo-600">
                      {order.orderCode}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{order.customerName}</div>
                      <div className="text-xs text-slate-500 font-mono">{order.customerPhone || '—'}</div>
                    </td>
                    <td className="py-4 px-6 max-w-[200px] truncate font-medium">
                      {order.eventName}
                    </td>
                    <td className="py-4 px-6 text-center font-semibold">
                      {order.ticketCount}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-900">
                      {formatMoney(order.totalAmount)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Badge className={`text-xs font-medium border ${getChannelBadgeStyle(order.channel)}`}>
                        {translateOrderChannel(order.channel)}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Badge className={`text-xs font-medium border ${getStatusBadgeStyle(order.status)}`}>
                        {translateOrderStatus(order.status)}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-center text-xs text-slate-500">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewOrderDetail(order.id)}
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1.5"
                      >
                        <Eye size={15} />
                        Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        {ordersPage && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
            <p className="text-xs text-slate-500">
              Hiển thị {orders.length} / {totalElements} đơn hàng
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={page <= 0}
                onClick={() => setPage((p) => p - 1)}
                className="text-xs border-slate-200"
              >
                Trước
              </Button>
              <span className="text-sm text-slate-600 font-medium">
                Trang {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs border-slate-200"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl bg-white border rounded-2xl p-6 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="border-b border-slate-100 pb-4 mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <span>Chi tiết đơn hàng:</span>
              <span className="font-mono text-indigo-600">
                {orderDetail ? orderDetail.orderCode : '...'}
              </span>
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-sm">Đang tải chi tiết đơn hàng...</p>
            </div>
          ) : (
            orderDetail && (
              <div className="space-y-6">
                {/* General Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <User size={16} className="text-slate-400" />
                      <span className="font-medium">Khách hàng:</span>
                      <span className="font-semibold text-slate-900">{orderDetail.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Phone size={16} className="text-slate-400" />
                      <span className="font-medium">SĐT liên lạc:</span>
                      <span className="font-mono text-slate-900">{orderDetail.customerPhone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Mail size={16} className="text-slate-400" />
                      <span className="font-medium">Email:</span>
                      <span className="text-slate-900">{orderDetail.customerEmail || '—'}</span>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Calendar size={16} className="text-slate-400" />
                      <span className="font-medium">Ngày lập:</span>
                      <span className="text-slate-900">{formatDateTime(orderDetail.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <ShoppingBag size={16} className="text-slate-400" />
                      <span className="font-medium">Doanh thu:</span>
                      <span className="font-bold text-indigo-700">{formatMoney(orderDetail.totalAmount)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="font-medium">Kênh bán:</span>
                      <div className="flex gap-2">
                        <Badge className={`text-xs font-semibold ${getChannelBadgeStyle(orderDetail.channel)}`}>
                          {translateOrderChannel(orderDetail.channel)}
                        </Badge>
                        {orderDetail.salesStaffName && (
                          <span className="text-xs text-slate-500 self-center">
                            (Bởi: {orderDetail.salesStaffName})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Details Section */}
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-3">Danh sách vé đã đặt</h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs bg-white">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                          <th className="py-3 px-4">Nhãn ghế</th>
                          <th className="py-3 px-4">Hạng vé</th>
                          <th className="py-3 px-4 text-right">Giá</th>
                          <th className="py-3 px-4 text-center">Trạng thái vé</th>
                          <th className="py-3 px-4">Thông tin soát vé</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {orderDetail.tickets.map((ticket) => (
                          <tr key={ticket.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              {ticket.seatLabel}
                            </td>
                            <td className="py-3 px-4 font-medium">
                              {ticket.ticketClassName}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-900">
                              {formatMoney(ticket.price)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                className={`text-[10px] font-medium border ${
                                  ticket.status === 'USED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : ticket.status === 'UNUSED'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {ticket.status === 'USED' ? 'ĐÃ SOÁT VÉ' : ticket.status === 'UNUSED' ? 'CHƯA DÙNG' : 'ĐÃ HỦY'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-500">
                              {ticket.status === 'USED' ? (
                                <div>
                                  <div>{formatDateTime(ticket.checkInTime)}</div>
                                  <div className="text-[10px] text-slate-400">
                                    Nhân viên soát vé: {ticket.checkInStaffName || 'Không rõ'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footnote indicating read-only constraints */}
                <div className="rounded-lg bg-indigo-50/50 border border-indigo-100 p-3 text-xs text-indigo-700">
                  ⚠️ <strong>Thông tin Giao dịch:</strong> Chi tiết hóa đơn và trạng thái vé hiển thị dưới dạng <strong>Chỉ đọc</strong> để bảo vệ dữ liệu giao dịch concert. Mọi hành động chỉnh sửa hoặc hủy vé cần liên hệ bộ phận kiểm toán.
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
