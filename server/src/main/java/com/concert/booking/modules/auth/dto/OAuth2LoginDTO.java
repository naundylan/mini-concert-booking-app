package com.concert.booking.modules.auth.dto;

import com.concert.booking.modules.user.UserInfo;

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
public class OAuth2LoginDTO {
  String accessToken;
  String refreshToken;
  Long accessTokenExpiration;
  Long refreshTokenExpiration;
  UserInfo userInfo;
}