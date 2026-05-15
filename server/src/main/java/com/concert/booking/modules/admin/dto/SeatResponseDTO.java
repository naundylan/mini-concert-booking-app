package com.concert.booking.modules.admin.dto;

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
public class SeatResponseDTO {
  UUID id;
  int gridRow;
  int gridColumn;
  String label;
  SeatStatus status;
  TicketClassDTO ticketClass;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @FieldDefaults(level = AccessLevel.PRIVATE)
  public static class TicketClassDTO {
    UUID id;
    String name;
    String colorCode;
    BigDecimal price;
  }
}
