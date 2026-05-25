package com.concert.booking.modules.customerbooking.dto;

import java.math.BigDecimal;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BankTransferInfoDTO {
  String accountNumber;
  String accountName;
  BigDecimal amount;
  String content;
}