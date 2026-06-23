package com.concert.booking.modules.order.dto;

import com.concert.booking.modules.order.enums.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminOrderResponseDTO {
  UUID id;
  String orderCode;
  String customerName;
  String customerPhone;
  String customerEmail;
  String eventName;
  BigDecimal totalAmount;
  OrderStatus status;
  Instant createdAt;
  long ticketCount;
  String channel; // "POS" or "ONLINE"
  String salesStaffName;
}
