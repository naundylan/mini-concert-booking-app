package com.concert.booking.modules.auth.security;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.experimental.UtilityClass;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@UtilityClass
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthUtils {
  SecureRandom SECURE_RANDOM = new SecureRandom();

  public String generateToken(int byteLength) {
    byte[] randomBytes = new byte[byteLength];
    SECURE_RANDOM.nextBytes(randomBytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
  }

  public String hashToken(String refreshToken) {
    return DigestUtils.sha256Hex(refreshToken);
  }

  public UUID getCurrentUserId() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      return null;
    }

    Object principal = authentication.getPrincipal();
    if (principal instanceof String principalValue) {
      try {
        return UUID.fromString(principalValue);
      } catch (IllegalArgumentException ignored) {
        return null;
      }
    }

    return null;
  }
}