package com.concert.booking.modules.auth.security;

import com.concert.booking.common.constants.JwtProperties;
import com.concert.booking.modules.auth.dto.TokenDTO;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthCookieService {
  public static final String ACCESS_TOKEN_COOKIE = "accessToken";
  public static final String REFRESH_TOKEN_COOKIE = "refreshToken";

  JwtProperties jwtProperties;

  public void addAuthCookies(HttpServletResponse response, TokenDTO tokenDTO) {
    addCookie(
        response,
        ACCESS_TOKEN_COOKIE,
        tokenDTO.getAccessToken(),
        Duration.ofMillis(jwtProperties.getAccessTokenExpiration()));
    addCookie(
        response,
        REFRESH_TOKEN_COOKIE,
        tokenDTO.getRefreshToken(),
        Duration.ofMillis(jwtProperties.getRefreshTokenExpiration()));
  }

  public void clearAuthCookies(HttpServletResponse response) {
    addCookie(response, ACCESS_TOKEN_COOKIE, "", Duration.ZERO);
    addCookie(response, REFRESH_TOKEN_COOKIE, "", Duration.ZERO);
  }

  public String getAccessToken(HttpServletRequest request) {
    return getCookieValue(request, ACCESS_TOKEN_COOKIE);
  }

  public String getRefreshToken(HttpServletRequest request) {
    return getCookieValue(request, REFRESH_TOKEN_COOKIE);
  }

  private void addCookie(
      HttpServletResponse response, String name, String value, Duration maxAge) {
    ResponseCookie cookie =
        ResponseCookie.from(name, value == null ? "" : value)
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path("/")
            .maxAge(maxAge)
            .build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }

  private String getCookieValue(HttpServletRequest request, String name) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) {
      return null;
    }

    for (Cookie cookie : cookies) {
      if (name.equals(cookie.getName())) {
        return cookie.getValue();
      }
    }

    return null;
  }
}
