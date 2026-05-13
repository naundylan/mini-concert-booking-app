package com.concert.booking.modules.order.dto;

import com.concert.booking.modules.order.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentCreateDTO {
  @NotNull(message = "Phương thức thanh toán không được để trống")
  PaymentMethod paymentMethod;

  @NotNull(message = "Số tiền thực nhận không được để trống")
  @PositiveOrZero(message = "Số tiền thực nhận không hợp lệ")
  BigDecimal amountReceived;
}
