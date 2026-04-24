package com.concert.booking.modules.auth.dto;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TokenDTO {
  String accessToken;
  String refreshToken;
  Long accessTokenExpiration;
  Long refreshTokenExpiration;
}
