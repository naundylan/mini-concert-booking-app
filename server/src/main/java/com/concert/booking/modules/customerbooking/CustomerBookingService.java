package com.concert.booking.modules.customerbooking;

import com.concert.booking.modules.customerbooking.dto.CheckoutRequestDTO;
import com.concert.booking.modules.customerbooking.dto.CheckoutSessionDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerEventDetailDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerEventSummaryDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerSeatCatalogDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerTicketDTO;
import com.concert.booking.modules.customerbooking.dto.CheckoutPaymentStatusDTO;
import com.concert.booking.modules.customerbooking.dto.SePayWebhookDTO;
import com.concert.booking.modules.customerbooking.dto.SeatSnapshotDTO;
import com.concert.booking.modules.customerbooking.dto.VietQrPaymentDTO;
import com.concert.booking.modules.customerbooking.dto.VnPayIpnResponseDTO;
import com.concert.booking.modules.customerbooking.dto.VnPayPaymentUrlDTO;
import com.concert.booking.modules.customerbooking.dto.VnPayReturnResultDTO;
import com.concert.booking.modules.order.dto.OrderResponseDTO;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CustomerBookingService {
  Page<CustomerEventSummaryDTO> getEvents(String keyword, String status, Pageable pageable);

  CustomerEventDetailDTO getEventDetail(UUID eventId);

  CustomerSeatCatalogDTO getCatalog(UUID eventId);

  CheckoutSessionDTO checkout(CheckoutRequestDTO checkoutRequest, UUID customerId);

  CheckoutSessionDTO getCheckoutSession(UUID paymentSessionId, UUID customerId);

  void releaseCheckout(UUID paymentSessionId, UUID customerId);

  OrderResponseDTO confirmPaymentSessionDev(UUID paymentSessionId, UUID customerId);

  VnPayPaymentUrlDTO createVnPayPaymentUrl(UUID paymentSessionId, UUID customerId, String ipAddress);

  VnPayIpnResponseDTO handleVnPayIpn(Map<String, String> params);

  VnPayReturnResultDTO getVnPayReturnResult(Map<String, String> params, UUID customerId);

  VietQrPaymentDTO createVietQrPayment(UUID paymentSessionId, UUID customerId);

  CheckoutPaymentStatusDTO getCheckoutPaymentStatus(UUID paymentSessionId, UUID customerId);

  Map<String, Boolean> handleSePayWebhook(String authorizationHeader, SePayWebhookDTO payload);

  OrderResponseDTO getCustomerOrder(UUID orderId, UUID customerId);

  Page<CustomerTicketDTO> getTickets(UUID customerId, Pageable pageable);

  SeatSnapshotDTO getSeatSnapshot(UUID eventId);
}
