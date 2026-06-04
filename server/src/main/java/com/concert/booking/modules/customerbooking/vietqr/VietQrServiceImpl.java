package com.concert.booking.modules.customerbooking.vietqr;

import com.concert.booking.common.constants.VietQrProperties;
import com.concert.booking.common.exception.AppException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VietQrServiceImpl implements VietQrService {

  static final String REFERENCE_PREFIX = "customer:payment-reference:";
  static final String SEPAY_WEBHOOK_PREFIX = "customer:sepay:webhook:";
  static final Duration SEPAY_WEBHOOK_TTL = Duration.ofHours(24);

  VietQrProperties vietQrProperties;
  StringRedisTemplate stringRedisTemplate;

  @Override
  public String createPaymentReference(UUID paymentSessionId) {
    return "MCB-" + paymentSessionId.toString().substring(0, 8).toUpperCase();
  }

  @Override
  public void savePaymentReference(String reference, UUID paymentSessionId, Duration ttl) {
    Boolean success =
        stringRedisTemplate
            .opsForValue()
            .setIfAbsent(referenceKey(reference), paymentSessionId.toString(), ttl);
    if (!Boolean.TRUE.equals(success)) {
      String existingPaymentSessionId = stringRedisTemplate.opsForValue().get(referenceKey(reference));
      if (!paymentSessionId.toString().equals(existingPaymentSessionId)) {
        throw new AppException(HttpStatus.CONFLICT, "Ma thanh toan VietQR vua bi trung. Vui long thu lai");
      }
    }
  }

  @Override
  public Optional<UUID> findPaymentSessionId(String reference) {
    String value = stringRedisTemplate.opsForValue().get(referenceKey(reference));
    if (value == null || value.isBlank()) {
      return Optional.empty();
    }
    try {
      return Optional.of(UUID.fromString(value));
    } catch (IllegalArgumentException ex) {
      stringRedisTemplate.delete(referenceKey(reference));
      return Optional.empty();
    }
  }

  @Override
  public boolean markSePayWebhookProcessed(Long sePayId) {
    if (sePayId == null) {
      return true;
    }
    Boolean success =
        stringRedisTemplate
            .opsForValue()
            .setIfAbsent(SEPAY_WEBHOOK_PREFIX + sePayId, "processed", SEPAY_WEBHOOK_TTL);
    return Boolean.TRUE.equals(success);
  }

  @Override
  public String buildQrUrl(BigDecimal amount, String content) {
    validateConfigured();
    String rawAmount = amount.setScale(0, RoundingMode.UNNECESSARY).toPlainString();
    return "https://img.vietqr.io/image/"
        + encodePath(vietQrProperties.getBankId())
        + "-"
        + encodePath(vietQrProperties.getAccountNo())
        + "-"
        + encodePath(vietQrProperties.getTemplate())
        + ".png?amount="
        + encode(rawAmount)
        + "&addInfo="
        + encode(content)
        + "&accountName="
        + encode(vietQrProperties.getAccountName());
  }

  private String referenceKey(String reference) {
    return REFERENCE_PREFIX + reference;
  }

  private void validateConfigured() {
    if (isBlank(vietQrProperties.getBankId())
        || isBlank(vietQrProperties.getAccountNo())
        || isBlank(vietQrProperties.getAccountName())
        || isBlank(vietQrProperties.getTemplate())) {
      throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "VietQR chua duoc cau hinh");
    }
  }

  private String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }

  private String encodePath(String value) {
    return encode(value).replace("+", "%20");
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
