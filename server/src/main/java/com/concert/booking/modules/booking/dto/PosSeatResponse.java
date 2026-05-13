package com.concert.booking.modules.booking.dto;

import com.concert.booking.modules.seat.enums.SeatStatus;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PosSeatResponse {
  UUID id;
  UUID ticketClassId;
  String ticketClassName;
  BigDecimal price;
  int gridRow;
  int gridColumn;
  String label;
  SeatStatus status;
}
