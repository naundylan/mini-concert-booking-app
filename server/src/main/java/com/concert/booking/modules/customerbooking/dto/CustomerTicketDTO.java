package com.concert.booking.modules.customerbooking.dto;

import com.concert.booking.modules.order.enums.TicketStatus;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CustomerTicketDTO {
  UUID ticketId;
  UUID orderId;
  String orderCode;
  UUID eventId;
  String eventName;
  String eventLocation;
  Timestamp eventStartTime;
  UUID seatId;
  String seatLabel;
  String label;
  UUID ticketClassId;
  String ticketClassName;
  String ticketClassColorCode;
  BigDecimal price;
  TicketStatus status;
  String qrPayload;
  String customerPhone;
  String customerEmail;
  String customerName;
  Timestamp bookingTime;
  String paymentMethod;
}
