package com.concert.booking.modules.booking;

import com.concert.booking.common.dto.DataApiResponse;
import com.concert.booking.modules.auth.security.AuthUtils;
import com.concert.booking.modules.booking.dto.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingV1Controller {
  BookingService bookingService;

  @GetMapping("/pos/customers/lookup")
  @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
  public DataApiResponse<PosCustomerLookupResponse> lookupCustomer(@RequestParam String phone) {
    return DataApiResponse.success(
        bookingService.lookupCustomerByPhone(phone), "Tra cứu khách hàng thành công");
  }

  @GetMapping("/pos/events")
  @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
  public DataApiResponse<List<PosEventResponse>> getOnSaleEvents() {
    return DataApiResponse.success(
        bookingService.getOnSaleEvents(), "Lấy danh sách sự kiện đang bán thành công");
  }

  @GetMapping("/pos/events/{eventId}/catalog")
  @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
  public DataApiResponse<PosCatalogResponse> getCatalog(@PathVariable UUID eventId) {
    return DataApiResponse.success(
        bookingService.getCatalog(eventId), "Lấy sơ đồ bán vé thành công");
  }

  @PostMapping("/pos")
  @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
  public DataApiResponse<PosBookingResponse> createPosBooking(
      @RequestBody @Valid PosBookingCreateRequest request) {
    UUID staffId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(
        bookingService.createPosBooking(request, staffId), "Tạo đơn hàng thành công");
  }

  @PostMapping("/webhooks/vnpay")
  public DataApiResponse<PosBookingResponse> handleVnpayWebhook(
      @RequestBody @Valid VnpayWebhookRequest request) {
    return DataApiResponse.success(
        bookingService.handleVnpayWebhook(request), "Xử lý webhook VNPay thành công");
  }
}
