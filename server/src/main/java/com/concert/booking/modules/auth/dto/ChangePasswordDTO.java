package com.concert.booking.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChangePasswordDTO {
  @NotBlank(message = "Mật khẩu hiện tại không được để trống")
  String currentPassword;

  @NotBlank(message = "Mật khẩu mới không được để trống")
  String newPassword;
}
