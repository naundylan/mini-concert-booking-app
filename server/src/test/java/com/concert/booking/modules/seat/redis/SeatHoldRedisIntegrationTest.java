package com.concert.booking.modules.seat.redis;

import static org.junit.jupiter.api.Assertions.*;

import com.concert.booking.BaseIntegrationTest;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;

@EnabledIf("com.concert.booking.BaseIntegrationTest#isDockerAvailable")
class SeatHoldRedisIntegrationTest extends BaseIntegrationTest {

  @Autowired SeatHoldRedisService seatHoldRedisService;
  @Autowired StringRedisTemplate stringRedisTemplate;

  @BeforeEach
  void cleanRedisBeforeTest() {
    // Clear all test keys in the Redis container
    var keys = stringRedisTemplate.keys("*");
    if (keys != null && !keys.isEmpty()) {
      stringRedisTemplate.delete(keys);
    }
  }

  @Test
  void holdAndCleanupSeats_withRedisContainer_shouldSucceed() throws Exception {
    UUID eventId = UUID.randomUUID();
    UUID paymentSessionId = UUID.randomUUID();
    List<UUID> seatIds = List.of(UUID.randomUUID(), UUID.randomUUID());

    // 1. Hold seats in the Redis container with 1 second TTL
    seatHoldRedisService.holdSeats(eventId, paymentSessionId, seatIds, Duration.ofSeconds(1));

    // Verify key exists in the container
    for (UUID seatId : seatIds) {
      String expectedKey = "customer:seat-hold:" + eventId + ":" + seatId;
      String actualValue = stringRedisTemplate.opsForValue().get(expectedKey);
      assertEquals(paymentSessionId.toString(), actualValue, "The session ID should be stored in Redis");
    }

    // 2. Query held seats from Redis container
    List<UUID> heldSeats = seatHoldRedisService.getHeldSeatIds(eventId);
    assertEquals(2, heldSeats.size());
    assertTrue(heldSeats.containsAll(seatIds));

    // 3. Wait for TTL to expire
    Thread.sleep(1100);

    // Verify key expired in Redis
    for (UUID seatId : seatIds) {
      String expectedKey = "customer:seat-hold:" + eventId + ":" + seatId;
      assertNull(stringRedisTemplate.opsForValue().get(expectedKey), "Seat hold key should have expired");
    }

    // 4. Run cleanup task and verify it detects and releases expired holds
    Map<UUID, List<UUID>> released = seatHoldRedisService.cleanupExpiredHolds();
    assertNotNull(released);
    assertTrue(released.containsKey(eventId));
    assertEquals(2, released.get(eventId).size());
    assertTrue(released.get(eventId).containsAll(seatIds));
  }
}
