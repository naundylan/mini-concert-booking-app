package com.concert.booking.core.ratelimit;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RateLimiterService {

  private static final ConcurrentHashMap<String, List<Instant>> rateLimitMap =
      new ConcurrentHashMap<>();
  private static final long WINDOW_DURATION_SECONDS = 15 * 60; // 15 minutes
  private static final int MAX_ATTEMPTS = 5;

  /**
   * Check if an action is allowed for a key within the rate limit window.
   *
   * @param key identifier (e.g., username for signin, userId for changePassword)
   * @param action type of action (e.g., "signin", "changePassword")
   * @return true if allowed, false if rate limited
   */
  public boolean isAllowed(String key, String action) {
    String rateLimitKey = generateKey(key, action);
    Instant now = Instant.now();

    rateLimitMap.computeIfPresent(
        rateLimitKey,
        (k, attempts) -> {
          attempts.removeIf(instant -> instant.plusSeconds(WINDOW_DURATION_SECONDS).isBefore(now));
          return attempts.isEmpty() ? null : attempts;
        });

    List<Instant> attempts = rateLimitMap.computeIfAbsent(rateLimitKey, k -> new ArrayList<>());

    if (attempts.size() >= MAX_ATTEMPTS) {
      return false;
    }

    attempts.add(now);
    return true;
  }

  /**
   * Get remaining attempts for a key.
   *
   * @param key identifier
   * @param action type of action
   * @return remaining attempts (0-5)
   */
  public int getRemainingAttempts(String key, String action) {
    String rateLimitKey = generateKey(key, action);
    Instant now = Instant.now();

    rateLimitMap.computeIfPresent(
        rateLimitKey,
        (k, attempts) -> {
          attempts.removeIf(instant -> instant.plusSeconds(WINDOW_DURATION_SECONDS).isBefore(now));
          return attempts.isEmpty() ? null : attempts;
        });

    List<Instant> attempts = rateLimitMap.get(rateLimitKey);
    return MAX_ATTEMPTS - (attempts == null ? 0 : attempts.size());
  }

  /**
   * Reset rate limit for a key (called on successful signin).
   *
   * @param key identifier
   * @param action type of action
   */
  public void reset(String key, String action) {
    String rateLimitKey = generateKey(key, action);
    rateLimitMap.remove(rateLimitKey);
  }

  private String generateKey(String key, String action) {
    return action + ":" + key;
  }
}
