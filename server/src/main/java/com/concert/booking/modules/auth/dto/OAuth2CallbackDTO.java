package com.concert.booking.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OAuth2CallbackDTO {
  @NotBlank(message = "Email không được để trống")
  String email;

  @NotBlank(message = "Số điện thoại không được để trống")
  @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
  String phone;

  @NotBlank(message = "Tên không được để trống")
  String fullName;

  @NotBlank(message = "Google ID không được để trống")
  String googleId;
}
