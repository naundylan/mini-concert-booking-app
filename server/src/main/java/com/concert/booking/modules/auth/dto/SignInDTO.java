package com.concert.booking.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SignInDTO {
  @NotBlank(message = "Tên đăng nhập không được để trống")
  String username;

  @NotBlank(message = "Mật khẩu không được để trống")
  String password;
}
