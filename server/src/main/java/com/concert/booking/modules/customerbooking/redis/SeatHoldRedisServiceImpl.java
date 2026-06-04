package com.concert.booking.modules.customerbooking.redis;

import com.concert.booking.common.exception.AppException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
public class SeatHoldRedisServiceImpl implements SeatHoldRedisService {

  static final String SEAT_HOLD_PREFIX = "customer:seat-hold:";
  static final String EVENT_HOLDS_PREFIX = "customer:event-holds:";

  StringRedisTemplate stringRedisTemplate;

  @Override
  public void holdSeats(UUID eventId, UUID paymentSessionId, List<UUID> seatIds, Duration ttl) {
    List<String> createdKeys = new ArrayList<>();

    for (UUID seatId : seatIds) {
      String seatHoldKey = seatHoldKey(eventId, seatId);
      Boolean success =
          stringRedisTemplate
              .opsForValue()
              .setIfAbsent(seatHoldKey, paymentSessionId.toString(), ttl);

      if (!Boolean.TRUE.equals(success)) {
        createdKeys.forEach(stringRedisTemplate::delete);
        throw new AppException(HttpStatus.CONFLICT, "Mot so ghe vua duoc nguoi khac giu");
      }

      createdKeys.add(seatHoldKey);
      stringRedisTemplate.opsForSet().add(eventHoldsKey(eventId), seatId.toString());
    }
  }

  @Override
  public void releaseSeats(UUID eventId, List<UUID> seatIds) {
    for (UUID seatId : seatIds) {
      stringRedisTemplate.delete(seatHoldKey(eventId, seatId));
      stringRedisTemplate.opsForSet().remove(eventHoldsKey(eventId), seatId.toString());
    }
  }

  @Override
  public List<UUID> getHeldSeatIds(UUID eventId) {
    Set<String> seatIds = stringRedisTemplate.opsForSet().members(eventHoldsKey(eventId));
    if (seatIds == null || seatIds.isEmpty()) {
      return List.of();
    }

    List<UUID> heldSeatIds = new ArrayList<>();
    for (String rawSeatId : seatIds) {
      UUID seatId = UUID.fromString(rawSeatId);
      String seatHoldKey = seatHoldKey(eventId, seatId);
      if (Boolean.TRUE.equals(stringRedisTemplate.hasKey(seatHoldKey))) {
        heldSeatIds.add(seatId);
      } else {
        stringRedisTemplate.opsForSet().remove(eventHoldsKey(eventId), rawSeatId);
      }
    }
    return heldSeatIds;
  }

  @Override
  public boolean hasAnyHeldSeat(UUID eventId, List<UUID> seatIds) {
    return seatIds.stream()
        .anyMatch(
            seatId -> Boolean.TRUE.equals(stringRedisTemplate.hasKey(seatHoldKey(eventId, seatId))));
  }

  @Override
  public boolean ownsAllHeldSeats(UUID eventId, UUID paymentSessionId, List<UUID> seatIds) {
    return seatIds.stream()
        .allMatch(
            seatId ->
                paymentSessionId
                    .toString()
                    .equals(stringRedisTemplate.opsForValue().get(seatHoldKey(eventId, seatId))));
  }

  @Override
  public Map<UUID, List<UUID>> cleanupExpiredHolds() {
    Set<String> eventHoldKeys = stringRedisTemplate.keys(EVENT_HOLDS_PREFIX + "*");
    if (eventHoldKeys == null || eventHoldKeys.isEmpty()) {
      return Map.of();
    }

    Map<UUID, List<UUID>> releasedSeatIdsByEvent = new HashMap<>();
    for (String eventHoldKey : eventHoldKeys) {
      UUID eventId = parseEventIdFromEventHoldsKey(eventHoldKey);
      if (eventId == null) {
        continue;
      }

      Set<String> rawSeatIds = stringRedisTemplate.opsForSet().members(eventHoldKey);
      if (rawSeatIds == null || rawSeatIds.isEmpty()) {
        continue;
      }

      for (String rawSeatId : rawSeatIds) {
        UUID seatId = parseUuid(rawSeatId);
        if (seatId == null) {
          stringRedisTemplate.opsForSet().remove(eventHoldKey, rawSeatId);
          continue;
        }
        if (!Boolean.TRUE.equals(stringRedisTemplate.hasKey(seatHoldKey(eventId, seatId)))) {
          stringRedisTemplate.opsForSet().remove(eventHoldKey, rawSeatId);
          releasedSeatIdsByEvent.computeIfAbsent(eventId, ignored -> new ArrayList<>()).add(seatId);
        }
      }
    }
    return releasedSeatIdsByEvent;
  }

  private String seatHoldKey(UUID eventId, UUID seatId) {
    return SEAT_HOLD_PREFIX + eventId + ":" + seatId;
  }

  private String eventHoldsKey(UUID eventId) {
    return EVENT_HOLDS_PREFIX + eventId;
  }

  private UUID parseEventIdFromEventHoldsKey(String key) {
    if (key == null || !key.startsWith(EVENT_HOLDS_PREFIX)) {
      return null;
    }
    return parseUuid(key.substring(EVENT_HOLDS_PREFIX.length()));
  }

  private UUID parseUuid(String value) {
    try {
      return UUID.fromString(value);
    } catch (IllegalArgumentException ex) {
      return null;
    }
  }
}
