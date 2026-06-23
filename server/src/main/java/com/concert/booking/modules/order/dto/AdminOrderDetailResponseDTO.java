package com.concert.booking.modules.order.dto;

import com.concert.booking.modules.order.enums.OrderStatus;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminOrderDetailResponseDTO {
  UUID id;
  String orderCode;
  String customerName;
  String customerPhone;
  String customerEmail;
  String eventName;
  BigDecimal totalAmount;
  OrderStatus status;
  Instant createdAt;
  String channel; // "POS" or "ONLINE"
  String salesStaffName;
  List<AdminTicketDetailDTO> tickets;

  @Value
  @Builder
  public static class AdminTicketDetailDTO {
    UUID id;
    String seatLabel;
    String ticketClassName;
    BigDecimal price;
    String status; // "UNUSED", "USED", "CANCELED"
    Timestamp checkInTime;
    String checkInStaffName;
  }
}
