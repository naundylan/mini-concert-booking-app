package com.concert.booking.modules.order;

import com.concert.booking.modules.event.Event;
import com.concert.booking.modules.order.dto.*;
import com.concert.booking.modules.order.enums.OrderStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {
  CustomerLookupDTO lookupCustomerByPhone(String phone);

  List<Event> getOnSaleEvents();

  SeatCatalogDTO getSeatCatalog(UUID eventId);

  OrderResponseDTO createOrder(OrderCreateDTO request, UUID staffId);

  OrderResponseDTO getPosOrderByCode(String orderCode);

  OrderResponseDTO handlePaymentWebhook(PaymentWebhookDTO request);

  Page<AdminOrderResponseDTO> getAdminOrders(
      String keyword, UUID eventId, OrderStatus status, Pageable pageable);

  AdminOrderDetailResponseDTO getAdminOrderDetail(UUID orderId);
}

