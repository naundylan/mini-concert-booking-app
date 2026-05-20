package com.concert.booking.modules.order.dto;

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
public class PaymentWebhookDTO {
  @NotBlank(message = "Mã đơn hàng không được để trống")
  String orderCode;

  @NotNull(message = "Trạng thái thanh toán không được để trống")
  Boolean success;

  BigDecimal amount;

  String transactionRef;
}
