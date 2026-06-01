package com.concert.booking.modules.customerbooking.dto;

import java.math.BigDecimal;
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
public class SePayWebhookDTO {
  Long id;
  String gateway;
  String transactionDate;
  String accountNumber;
  String subAccount;
  String code;
  String content;
  String transferType;
  String description;
  BigDecimal transferAmount;
  BigDecimal accumulated;
  String referenceCode;
}
