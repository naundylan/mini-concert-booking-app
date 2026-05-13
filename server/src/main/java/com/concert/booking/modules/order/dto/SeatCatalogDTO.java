package com.concert.booking.modules.order.dto;

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
public class SeatCatalogDTO {
  UUID eventId;
  String eventName;
  List<TicketClassDTO> ticketClasses;
  List<OrderItemResponseDTO> seats;

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
