package com.concert.booking.core.auth;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TokenBlacklistService {

  private static final ConcurrentHashMap<String, Instant> blacklistedTokens =
      new ConcurrentHashMap<>();

  /**
   * Blacklist a token (invalidate it).
   *
   * @param token the JWT token to blacklist
   * @param expirationTime token expiration time
   */
  public void blacklistToken(String token, Instant expirationTime) {
    blacklistedTokens.put(token, expirationTime);
    // Clean up expired tokens periodically
    cleanupExpiredTokens();
  }

  /**
   * Check if a token is blacklisted.
   *
   * @param token the JWT token to check
   * @return true if token is blacklisted and not yet expired
   */
  public boolean isBlacklisted(String token) {
    Instant expirationTime = blacklistedTokens.get(token);
    if (expirationTime == null) {
      return false;
    }

    // If token has expired, remove it and return false
    if (Instant.now().isAfter(expirationTime)) {
      blacklistedTokens.remove(token);
      return false;
    }

    return true;
  }

  /** Clean up expired tokens from the blacklist. */
  private void cleanupExpiredTokens() {
    Instant now = Instant.now();
    blacklistedTokens.entrySet().stream()
        .filter(entry -> entry.getValue().isBefore(now))
        .forEach(entry -> blacklistedTokens.remove(entry.getKey()));
  }
}
