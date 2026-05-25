package com.concert.booking.modules.customerbooking.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckoutSessionDTO {
  UUID paymentSessionId;
  UUID eventId;
  Instant expiresAt;
  BigDecimal totalAmount;
  BankTransferInfoDTO bankTransferInfo;
  List<CustomerSelectedSeatDTO> selectedSeats;
}