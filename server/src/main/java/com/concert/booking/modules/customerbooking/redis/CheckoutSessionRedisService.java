package com.concert.booking.modules.customerbooking.redis;

import com.concert.booking.modules.customerbooking.dto.CheckoutSessionDTO;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CheckoutSessionRedisService {
  void save(CheckoutSessionDTO session, Duration ttl);

  Optional<CheckoutSessionDTO> findById(UUID paymentSessionId);

  void delete(UUID paymentSessionId);

  void addActiveSession(UUID eventId, UUID customerId, UUID paymentSessionId);

  List<CheckoutSessionDTO> findActiveSessions(UUID eventId, UUID customerId);

  void deleteActiveSession(UUID eventId, UUID customerId, UUID paymentSessionId);
}
