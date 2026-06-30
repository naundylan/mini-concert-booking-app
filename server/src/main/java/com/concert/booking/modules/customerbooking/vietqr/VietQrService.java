package com.concert.booking.modules.customerbooking.vietqr;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

public interface VietQrService {
  String createPaymentReference(UUID paymentSessionId);

  void savePaymentReference(String reference, UUID paymentSessionId, Duration ttl);

  Optional<UUID> findPaymentSessionId(String reference);

  boolean markSePayWebhookProcessed(Long sePayId);

  void deleteSePayWebhookProcessed(Long sePayId);

  String buildQrUrl(BigDecimal amount, String content);
}
