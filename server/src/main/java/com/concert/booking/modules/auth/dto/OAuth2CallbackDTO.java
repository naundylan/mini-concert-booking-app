package com.concert.booking.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
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
  
  String phone;
  
  @NotBlank(message = "Tên không được để trống")
  String fullName;
  
  @NotBlank(message = "Google ID không được để trống")
  String googleId;
}