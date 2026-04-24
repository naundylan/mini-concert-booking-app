package com.concert.booking.modules.auth.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor 
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TokenDTO {
  String accessToken;
  String refreshToken;
  Long accessTokenExpiration;
  Long refreshTokenExpiration;
}
