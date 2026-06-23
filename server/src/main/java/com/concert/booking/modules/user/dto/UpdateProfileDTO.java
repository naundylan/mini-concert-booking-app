package com.concert.booking.modules.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileDTO {
  @NotBlank(message = "Họ và tên không được để trống")
  @Size(max = 255, message = "Họ và tên tối đa 255 ký tự")
  String fullName;
}
