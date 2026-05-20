package com.concert.booking.modules.order;

import com.concert.booking.modules.order.dto.*;
import com.concert.booking.modules.event.Event;
import java.util.List;
import java.util.UUID;

public interface OrderService {
  CustomerLookupDTO lookupCustomerByPhone(String phone);

  List<Event> getOnSaleEvents();

  SeatCatalogDTO getSeatCatalog(UUID eventId);

  OrderResponseDTO createOrder(OrderCreateDTO request, UUID staffId);

  OrderResponseDTO handlePaymentWebhook(PaymentWebhookDTO request);
}
