package com.concert.booking.core.auth;

import java.time.Duration;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TokenBlacklistService {

  static final String BLACKLIST_PREFIX = "blacklist:";

  StringRedisTemplate redisTemplate;

  /**
   * Blacklist a token (invalidate it).
   *
   * @param token the JWT token to blacklist
   * @param expirationTime token expiration time
   */
  public void blacklistToken(String token, Instant expirationTime) {
    long seconds = Duration.between(Instant.now(), expirationTime).toSeconds();
    if (seconds > 0) {
      redisTemplate.opsForValue().set(BLACKLIST_PREFIX + token, "1", Duration.ofSeconds(seconds));
    }
  }

  /**
   * Check if a token is blacklisted.
   *
   * @param token the JWT token to check
   * @return true if token is blacklisted and not yet expired
   */
  public boolean isBlacklisted(String token) {
    return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token));
  }
}
