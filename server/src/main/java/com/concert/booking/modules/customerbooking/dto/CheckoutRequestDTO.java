package com.concert.booking.modules.customerbooking.dto;

import com.concert.booking.modules.order.enums.PaymentMethod;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckoutRequestDTO {

  @NotNull(message = "Sự kiện không được để trống")
  UUID eventId;

  @NotEmpty(message = "Phải chọn ít nhất một ghế")
  @Size(max = 10, message = "Chỉ được chọn tối đa 10 ghế")
  List<@NotNull(message = "ID ghế không được để trống") UUID> seatIds;

  @NotNull(message = "Phương thức thanh toán không được để trống")
  PaymentMethod paymentMethod;
}
