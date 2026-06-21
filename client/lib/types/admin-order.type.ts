export interface AdminOrderResponse {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  eventName: string;
  totalAmount: number;
  status: 'PAID' | 'CANCELED';
  createdAt: string;
  ticketCount: number;
  channel: 'POS' | 'ONLINE';
  salesStaffName: string | null;
}

export interface AdminTicketDetail {
  id: string;
  seatLabel: string;
  ticketClassName: string;
  price: number;
  status: 'UNUSED' | 'USED' | 'CANCELED';
  checkInTime: string | null;
  checkInStaffName: string | null;
}

export interface AdminOrderDetailResponse {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  eventName: string;
  totalAmount: number;
  status: 'PAID' | 'CANCELED';
  createdAt: string;
  channel: 'POS' | 'ONLINE';
  salesStaffName: string | null;
  tickets: AdminTicketDetail[];
}
