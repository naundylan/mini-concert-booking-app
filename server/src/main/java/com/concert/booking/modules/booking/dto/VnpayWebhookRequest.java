package com.concert.booking.modules.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VnpayWebhookRequest {
  @NotBlank(message = "Mã đơn hàng không được để trống")
  String bookingCode;

  @NotNull(message = "Trạng thái thanh toán không được để trống")
  Boolean success;

  BigDecimal amount;
}
