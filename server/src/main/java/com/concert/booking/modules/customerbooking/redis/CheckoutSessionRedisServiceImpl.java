package com.concert.booking.modules.customerbooking.redis;

import com.concert.booking.modules.customerbooking.dto.CheckoutSessionDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CheckoutSessionRedisServiceImpl implements CheckoutSessionRedisService {

  static final String KEY_PREFIX = "customer:checkout:session:";
  static final String ACTIVE_KEY_PREFIX = "customer:checkout:active:";

  StringRedisTemplate stringRedisTemplate;
  ObjectMapper objectMapper;

  @Override
  public void save(CheckoutSessionDTO session, Duration ttl) {
    try {
      stringRedisTemplate
          .opsForValue()
          .set(key(session.getPaymentSessionId()), objectMapper.writeValueAsString(session), ttl);
    } catch (JsonProcessingException ex) {
      throw new IllegalStateException("Cannot serialize checkout session", ex);
    }
  }

  @Override
  public Optional<CheckoutSessionDTO> findById(UUID paymentSessionId) {
    String value = stringRedisTemplate.opsForValue().get(key(paymentSessionId));
    if (value == null || value.isBlank()) {
      return Optional.empty();
    }

    try {
      return Optional.of(objectMapper.readValue(value, CheckoutSessionDTO.class));
    } catch (JsonProcessingException ex) {
      throw new IllegalStateException("Cannot deserialize checkout session", ex);
    }
  }

  @Override
  public void delete(UUID paymentSessionId) {
    stringRedisTemplate.delete(key(paymentSessionId));
  }

  @Override
  public void addActiveSession(UUID eventId, UUID customerId, UUID paymentSessionId) {
    stringRedisTemplate.opsForSet().add(activeKey(eventId, customerId), paymentSessionId.toString());
  }

  @Override
  public List<CheckoutSessionDTO> findActiveSessions(UUID eventId, UUID customerId) {
    String activeKey = activeKey(eventId, customerId);
    Set<String> values = stringRedisTemplate.opsForSet().members(activeKey);
    if (values == null || values.isEmpty()) {
      return List.of();
    }

    return values.stream()
        .map(rawSessionId -> toUuid(rawSessionId, activeKey))
        .flatMap(Optional::stream)
        .map(
            sessionId -> {
              Optional<CheckoutSessionDTO> session = findById(sessionId);
              if (session.isEmpty()
                  || session.get().getExpiresAt() == null
                  || !session.get().getExpiresAt().isAfter(Instant.now())) {
                stringRedisTemplate.opsForSet().remove(activeKey, sessionId.toString());
                return Optional.<CheckoutSessionDTO>empty();
              }
              return session;
            })
        .flatMap(Optional::stream)
        .sorted(Comparator.comparing(CheckoutSessionDTO::getExpiresAt))
        .toList();
  }

  @Override
  public void deleteActiveSession(UUID eventId, UUID customerId, UUID paymentSessionId) {
    stringRedisTemplate.opsForSet().remove(activeKey(eventId, customerId), paymentSessionId.toString());
  }

  private String key(UUID paymentSessionId) {
    return KEY_PREFIX + paymentSessionId;
  }

  private String activeKey(UUID eventId, UUID customerId) {
    return ACTIVE_KEY_PREFIX + eventId + ":" + customerId;
  }

  private Optional<UUID> toUuid(String value, String activeKey) {
    try {
      return Optional.of(UUID.fromString(value));
    } catch (IllegalArgumentException ex) {
      stringRedisTemplate.opsForSet().remove(activeKey, value);
      return Optional.empty();
    }
  }
}
