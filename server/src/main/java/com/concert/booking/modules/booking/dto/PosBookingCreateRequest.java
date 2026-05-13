package com.concert.booking.modules.booking.dto;

import com.concert.booking.modules.booking.enums.PaymentMethod;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PosBookingCreateRequest {
  @NotNull(message = "Sự kiện không được để trống")
  UUID eventId;

  @NotBlank(message = "Số điện thoại không được để trống")
  @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
  String phone;

  @NotBlank(message = "Tên khách hàng không được để trống")
  @Size(max = 255, message = "Tên khách hàng không được vượt quá 255 ký tự")
  String fullName;

  @Email(message = "Email không hợp lệ")
  @Size(max = 255, message = "Email không được vượt quá 255 ký tự")
  String email;

  @NotEmpty(message = "Phải chọn ít nhất một ghế")
  List<UUID> seatIds;

  @NotNull(message = "Phương thức thanh toán không được để trống")
  PaymentMethod paymentMethod;

  @PositiveOrZero(message = "Số tiền thực nhận không hợp lệ")
  BigDecimal amountReceived;
}
