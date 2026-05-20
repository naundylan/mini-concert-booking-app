package com.concert.booking.modules.order.dto;

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
public class OrderItemResponseDTO {
  UUID id;
  UUID seatId;
  UUID ticketClassId;
  String seatLabel;
  String ticketClassName;
  BigDecimal price;
  Integer gridRow;
  Integer gridColumn;
  SeatStatus seatStatus;
  String label;
  SeatStatus status;
  TicketClassInfoDTO ticketClass;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @FieldDefaults(level = AccessLevel.PRIVATE)
  public static class TicketClassInfoDTO {
    UUID id;
    String name;
    String colorCode;
    BigDecimal price;
  }
}
