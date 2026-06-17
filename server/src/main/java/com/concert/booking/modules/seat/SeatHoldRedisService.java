package com.concert.booking.modules.seat;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Simple Redis based seat hold service. Stores a temporary lock for each seat to prevent
 * concurrent online bookings from selecting the same seat. The lock key expires after a
 * configurable TTL (default 5 minutes). This service is invoked only after the DB
 * transaction for the seat hold commits successfully, ensuring atomicity between DB and
 * Redis.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SeatHoldRedisService {

    StringRedisTemplate redisTemplate;

    /** TTL for the Redis hold key (5 minutes). */
    private static final Duration HOLD_TTL = Duration.ofMinutes(5);

    /**
     * Lock the given seat ids for the specified event.
     *
     * @param eventId the event identifier
     * @param seatIds list of seat UUIDs to lock
     */
    public void lockSeats(UUID eventId, List<UUID> seatIds) {
        for (UUID seatId : seatIds) {
            String key = buildKey(eventId, seatId);
            try {
                // Use SETNX semantics via opsForValue().setIfAbsent
                Boolean locked = redisTemplate.opsForValue().setIfAbsent(key, "locked", HOLD_TTL);
                if (Boolean.TRUE.equals(locked)) {
                    log.debug("Locked seat {} for event {} in Redis", seatId, eventId);
                } else {
                    log.warn("Seat {} for event {} was already locked in Redis", seatId, eventId);
                }
            } catch (Exception e) {
                log.error("Failed to lock seat {} for event {} in Redis", seatId, eventId, e);
                // Swallow exception to avoid breaking DB transaction flow; failures will be
                // handled by retrying the whole booking flow.
            }
        }
    }

    /**
     * Release previously locked seats (e.g., when a hold is cancelled).
     *
     * @param eventId the event identifier
     * @param seatIds list of seat UUIDs to release
     */
    public void releaseSeats(UUID eventId, List<UUID> seatIds) {
        for (UUID seatId : seatIds) {
            String key = buildKey(eventId, seatId);
            try {
                redisTemplate.delete(key);
                log.debug("Released Redis lock for seat {} of event {}", seatId, eventId);
            } catch (Exception e) {
                log.error("Failed to release Redis lock for seat {} of event {}", seatId, eventId, e);
            }
        }
    }

    private String buildKey(UUID eventId, UUID seatId) {
        return "seathold:" + eventId + ":" + seatId;
    }
}
