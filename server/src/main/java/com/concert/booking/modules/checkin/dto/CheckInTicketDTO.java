package com.concert.booking.modules.checkin.dto;

import com.concert.booking.modules.order.enums.TicketStatus;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckInTicketDTO {
  UUID ticketId;
  String seatLabel;
  String label;
  UUID ticketClassId;
  String ticketClassName;
  BigDecimal price;
  TicketStatus status;
  Timestamp checkInTime;
  UUID checkInBy;
  String checkInByName;
}
