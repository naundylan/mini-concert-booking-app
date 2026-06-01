package com.concert.booking.modules.customerbooking.dto;

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
public class VnPayReturnResultDTO {
  String status;
  UUID eventId;
  UUID orderId;
  UUID paymentSessionId;
  String message;
}
