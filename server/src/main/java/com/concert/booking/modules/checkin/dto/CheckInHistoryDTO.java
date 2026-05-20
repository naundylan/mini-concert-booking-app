package com.concert.booking.modules.checkin.dto;

import com.concert.booking.modules.order.enums.TicketStatus;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckInHistoryDTO {
  UUID ticketId;
  UUID orderId;
  String orderCode;
  UUID eventId;
  String eventName;
  UUID customerId;
  String customerName;
  String phone;
  String seatLabel;
  UUID ticketClassId;
  String ticketClassName;
  BigDecimal price;
  TicketStatus status;
  Timestamp checkInTime;
  UUID checkInBy;
  String checkInByName;
}
