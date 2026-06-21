package com.concert.booking.modules.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateStaffDTO {

  @NotBlank(message = "Họ tên không được để trống")
  @Size(max = 255, message = "Họ tên không được vượt quá 255 ký tự")
  String fullName;

  @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
  String phone;

  @Email(message = "Email không hợp lệ")
  @Size(max = 255, message = "Email không được vượt quá 255 ký tự")
  String email;

  @NotBlank(message = "Tên đăng nhập không được để trống")
  @Size(max = 100, message = "Tên đăng nhập không được vượt quá 100 ký tự")
  String username;
}
