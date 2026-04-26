package com.concert.booking.modules.auth.security;

import com.concert.booking.common.constants.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class JwtService {

  JwtProperties jwtProperties;

  SecretKey getSignKey() {
    return Keys.hmacShaKeyFor(jwtProperties.getSecretKey().getBytes(StandardCharsets.UTF_8));
  }

  public String generateAccessToken(UUID id) {
    return Jwts.builder()
        .subject(id.toString())
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + jwtProperties.getAccessTokenExpiration()))
        .signWith(this.getSignKey())
        .compact();
  }

  public String generateRefreshToken(UUID id) {
    return Jwts.builder()
        .subject(id.toString())
        .issuedAt(new Date())
        .expiration(
            new Date(System.currentTimeMillis() + jwtProperties.getRefreshTokenExpiration()))
        .signWith(this.getSignKey())
        .compact();
  }

  public UUID extractUserId(String token) {
    return UUID.fromString(extractAllClaims(token).getSubject());
  }

  public boolean isTokenValid(String token, CustomUserDetails userDetails) {
    try {
      UUID id = extractUserId(token);
      return id.equals(userDetails.getId()) && !isTokenExpired(token);
    } catch (Exception e) {
      return false;
    }
  }

  private boolean isTokenExpired(String token) {
    return extractAllClaims(token).getExpiration().before(new Date());
  }

  public Instant getTokenExpiration(String token) {
    return extractAllClaims(token).getExpiration().toInstant();
  }

  public Instant getTokenIssuedAt(String token) {
    return extractAllClaims(token).getIssuedAt().toInstant();
  }

  private Claims extractAllClaims(String token) {
    return Jwts.parser()
        .verifyWith(this.getSignKey())
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }
}
