package com.concert.booking.modules.order.dto;

import com.concert.booking.modules.order.enums.OrderStatus;
import com.concert.booking.modules.order.enums.PaymentMethod;
import com.concert.booking.modules.order.enums.PaymentStatus;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderResponseDTO {
  UUID orderId;
  String orderCode;
  UUID customerId;
  UUID eventId;
  String eventName;
  String eventLocation;
  Timestamp eventStartTime;
  OrderStatus status;
  BigDecimal totalAmount;
  PaymentMethod paymentMethod;
  PaymentStatus paymentStatus;
  BigDecimal amountReceived;
  List<OrderItemResponseDTO> items;
}
