package com.concert.booking.modules.customerbooking.dto;

import java.math.BigDecimal;
import java.time.Instant;
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
public class VietQrPaymentDTO {
  String qrUrl;
  String bankId;
  String accountNo;
  String accountName;
  BigDecimal amount;
  String content;
  Instant expiredAt;
}
