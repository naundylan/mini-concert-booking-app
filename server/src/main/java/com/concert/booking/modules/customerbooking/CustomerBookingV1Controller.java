package com.concert.booking.modules.customerbooking;

import com.concert.booking.common.dto.DataApiResponse;
import com.concert.booking.modules.auth.security.AuthUtils;
import com.concert.booking.modules.customerbooking.dto.*;
import com.concert.booking.modules.order.dto.OrderResponseDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/customer")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CustomerBookingV1Controller {

  CustomerBookingService customerBookingService;

  @GetMapping("/events")
  @PreAuthorize("hasRole('CUSTOMER')")
  public DataApiResponse<Page<CustomerEventSummaryDTO>> getEvents(
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) String status,
      Pageable pageable) {
    return DataApiResponse.success(
        customerBookingService.getEvents(keyword, status, pageable),
        "Lấy danh sách sự kiện thành công");
  }

  @GetMapping("/events/{eventId}")
  @PreAuthorize("hasRole('CUSTOMER')")
  public DataApiResponse<CustomerEventDetailDTO> getEventDetail(@PathVariable UUID eventId) {
    return DataApiResponse.success(
        customerBookingService.getEventDetail(eventId),
        "Lấy chi tiết sự kiện thành công");
  }

  @GetMapping("/events/{eventId}/catalog")
  @PreAuthorize("hasRole('CUSTOMER')")
  public DataApiResponse<CustomerSeatCatalogDTO> getCatalog(@PathVariable UUID eventId) {
    return DataApiResponse.success(
        customerBookingService.getCatalog(eventId),
        "Lấy sơ đồ ghế thành công");
  }

  @PostMapping("/checkout")
  @PreAuthorize("hasRole('CUSTOMER')")
  public DataApiResponse<CheckoutSessionDTO> checkout(
      @RequestBody @Valid CheckoutRequestDTO request) {
    UUID customerId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(
        customerBookingService.checkout(request, customerId),
        "Tạo phiên thanh toán thành công");
  }

  @GetMapping("/checkout/{paymentSessionId}")
  @PreAuthorize("hasRole('CUSTOMER')")
  public DataApiResponse<CheckoutSessionDTO> getCheckoutSession(
      @PathVariable UUID paymentSessionId) {
    UUID customerId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(
        customerBookingService.getCheckoutSession(paymentSessionId, customerId),
        "Lấy phiên thanh toán thành công");
  }

  @DeleteMapping("/checkout/{paymentSessionId}")
  @PreAuthorize("hasRole('CUSTOMER')")
  public DataApiResponse<Void> releaseCheckout(@PathVariable UUID paymentSessionId) {
    UUID customerId = AuthUtils.getCurrentUserId();
    customerBookingService.releaseCheckout(paymentSessionId, customerId);
    return DataApiResponse.success(null, "Đã hủy phiên thanh toán");
  }

  @PostMapping("/checkout/{paymentSessionId}/confirm-dev")
  @PreAuthorize("hasRole('CUSTOMER')")
  public DataApiResponse<OrderResponseDTO> confirmPaymentSessionDev(
      @PathVariable UUID paymentSessionId) {
    UUID customerId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(
        customerBookingService.confirmPaymentSessionDev(paymentSessionId, customerId),
        "XÃ¡c nháº­n thanh toÃ¡n dev thÃ nh cÃ´ng");
  }

  @PostMapping("/checkout/{paymentSessionId}/vnpay")
  @PreAuthorize("hasRole('CUSTOMER')")
  public DataApiResponse<VnPayPaymentUrlDTO> createVnPayPaymentUrl(
      @PathVariable UUID paymentSessionId, HttpServletRequest request) {
    UUID customerId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(
        customerBookingService.createVnPayPaymentUrl(
            paymentSessionId, customerId, getClientIpAddress(request)),
        "Tao duong dan thanh toan VNPay thanh cong");
  }

  @PostMapping("/checkout/{paymentSessionId}/vietqr")
  @PreAuthorize("hasRole('CUSTOMER')")
  public DataApiResponse<VietQrPaymentDTO> createVietQrPayment(
      @PathVariable UUID paymentSessionId) {
    UUID customerId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(
        customerBookingService.createVietQrPayment(paymentSessionId, customerId),
        "Tao thong tin thanh toan VietQR thanh cong");
  }

  @GetMapping("/checkout/{paymentSessionId}/payment-status")
  @PreAuthorize("hasRole('CUSTOMER')")
  public DataApiResponse<CheckoutPaymentStatusDTO> getCheckoutPaymentStatus(
      @PathVariable UUID paymentSessionId) {
    UUID customerId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(
        customerBookingService.getCheckoutPaymentStatus(paymentSessionId, customerId),
        "Lay trang thai thanh toan thanh cong");
  }

  @GetMapping("/payments/vnpay/ipn")
  public VnPayIpnResponseDTO handleVnPayIpn(@RequestParam Map<String, String> params) {
    return customerBookingService.handleVnPayIpn(params);
  }

  @PostMapping("/payments/vietqr/webhook")
  public Map<String, Boolean> handleSePayWebhook(
      @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
      @RequestBody SePayWebhookDTO payload) {
    return customerBookingService.handleSePayWebhook(authorizationHeader, payload);
  }

  @GetMapping("/payments/vnpay/return")
  @PreAuthorize("hasRole('CUSTOMER')")
  public DataApiResponse<VnPayReturnResultDTO> getVnPayReturnResult(
      @RequestParam Map<String, String> params) {
    UUID customerId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(
        customerBookingService.getVnPayReturnResult(params, customerId),
        "Lay ket qua thanh toan VNPay thanh cong");
  }

  @GetMapping("/orders/{orderId}")
  @PreAuthorize("hasRole('CUSTOMER')")
  public DataApiResponse<OrderResponseDTO> getOrder(@PathVariable UUID orderId) {
    UUID customerId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(
        customerBookingService.getCustomerOrder(orderId, customerId),
        "Lấy đơn hàng thành công");
  }

  private String getClientIpAddress(HttpServletRequest request) {
    String forwardedFor = request.getHeader("X-Forwarded-For");
    if (forwardedFor != null && !forwardedFor.isBlank()) {
      return forwardedFor.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }

  @GetMapping("/tickets")
  @PreAuthorize("hasRole('CUSTOMER')")
  public DataApiResponse<Page<CustomerTicketDTO>> getTickets(Pageable pageable) {
    UUID customerId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(
        customerBookingService.getTickets(customerId, pageable),
        "Lấy danh sách vé thành công");
  }
}
