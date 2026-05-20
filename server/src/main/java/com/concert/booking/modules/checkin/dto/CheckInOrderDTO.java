package com.concert.booking.modules.checkin.dto;

import com.concert.booking.modules.order.enums.OrderStatus;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckInOrderDTO {
  UUID orderId;
  String orderCode;
  UUID eventId;
  UUID customerId;
  String customerName;
  String phone;
  OrderStatus status;
  BigDecimal totalAmount;
  List<CheckInTicketDTO> tickets;
}
