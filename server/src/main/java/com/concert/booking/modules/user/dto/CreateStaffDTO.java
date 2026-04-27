package com.concert.booking.modules.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateStaffDTO {

  @NotBlank(message = "Họ tên không được để trống")
  @Size(max = 255, message = "Họ tên không được vượt quá 255 ký tự")
  String fullName;

  @NotBlank(message = "Số điện thoại không được để trống")
  @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
  String phone;

  @NotBlank(message = "Tên đăng nhập không được để trống")
  @Size(max = 100, message = "Tên đăng nhập không được vượt quá 100 ký tự")
  String username;

  @NotBlank(message = "Mật khẩu không được để trống")
  @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
  String password;
}
