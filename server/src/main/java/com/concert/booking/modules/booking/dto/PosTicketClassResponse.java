package com.concert.booking.modules.booking.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PosTicketClassResponse {
  UUID id;
  String name;
  String colorCode;
  BigDecimal price;
}
