package com.concert.booking.modules.customerbooking.dto;

import java.math.BigDecimal;
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
public class CustomerSeatDTO {
  UUID id;
  String label;
  int gridRow;
  int gridColumn;
  UUID ticketClassId;
  String ticketClassName;
  BigDecimal price;
  String colorCode;
  String status;
}
