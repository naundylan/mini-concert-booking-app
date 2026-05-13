package com.concert.booking.modules.order;

import com.concert.booking.common.dto.DataApiResponse;
import com.concert.booking.modules.auth.security.AuthUtils;
import com.concert.booking.modules.event.Event;
import com.concert.booking.modules.order.dto.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderV1Controller {
  OrderService orderService;

  @GetMapping("/pos/customers/lookup")
  @PreAuthorize("hasRole('STAFF')")
  public DataApiResponse<CustomerLookupDTO> lookupCustomer(@RequestParam String phone) {
    return DataApiResponse.success(
        orderService.lookupCustomerByPhone(phone), "Tra cứu khách hàng thành công");
  }

  @GetMapping("/pos/events")
  @PreAuthorize("hasRole('STAFF')")
  public DataApiResponse<List<Event>> getOnSaleEvents() {
    return DataApiResponse.success(
        orderService.getOnSaleEvents(), "Lấy danh sách sự kiện đang bán thành công");
  }

  @GetMapping("/pos/events/{eventId}/catalog")
  @PreAuthorize("hasRole('STAFF')")
  public DataApiResponse<SeatCatalogDTO> getSeatCatalog(@PathVariable UUID eventId) {
    return DataApiResponse.success(
        orderService.getSeatCatalog(eventId), "Lấy sơ đồ bán vé thành công");
  }

  @PostMapping("/pos")
  @PreAuthorize("hasRole('STAFF')")
  public DataApiResponse<OrderResponseDTO> createOrder(@RequestBody @Valid OrderCreateDTO request) {
    UUID staffId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(orderService.createOrder(request, staffId), "Tạo đơn hàng thành công");
  }

  @PostMapping("/webhooks/payment")
  public DataApiResponse<OrderResponseDTO> handlePaymentWebhook(
      @RequestBody @Valid PaymentWebhookDTO request) {
    return DataApiResponse.success(
        orderService.handlePaymentWebhook(request), "Xử lý webhook thanh toán thành công");
  }
}
