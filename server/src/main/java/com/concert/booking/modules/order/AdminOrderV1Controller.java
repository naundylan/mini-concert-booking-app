package com.concert.booking.modules.order;

import com.concert.booking.common.dto.DataApiResponse;
import com.concert.booking.modules.order.dto.AdminOrderDetailResponseDTO;
import com.concert.booking.modules.order.dto.AdminOrderResponseDTO;
import com.concert.booking.modules.order.enums.OrderStatus;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminOrderV1Controller {
  OrderService orderService;

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public DataApiResponse<Page<AdminOrderResponseDTO>> getAdminOrders(
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) UUID eventId,
      @RequestParam(required = false) OrderStatus status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<AdminOrderResponseDTO> orders = orderService.getAdminOrders(keyword, eventId, status, pageable);
    return DataApiResponse.success(orders, "Lấy danh sách đơn hàng thành công");
  }

  @GetMapping("/{orderId}")
  @PreAuthorize("hasRole('ADMIN')")
  public DataApiResponse<AdminOrderDetailResponseDTO> getAdminOrderDetail(
      @PathVariable UUID orderId) {
    AdminOrderDetailResponseDTO detail = orderService.getAdminOrderDetail(orderId);
    return DataApiResponse.success(detail, "Lấy chi tiết đơn hàng thành công");
  }
}
