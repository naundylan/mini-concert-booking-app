package com.concert.booking.modules.customerbooking.redis;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface SeatHoldRedisService {
  void holdSeats(UUID eventId, UUID paymentSessionId, List<UUID> seatIds, Duration ttl);

  void releaseSeats(UUID eventId, List<UUID> seatIds);

  List<UUID> getHeldSeatIds(UUID eventId);

  boolean hasAnyHeldSeat(UUID eventId, List<UUID> seatIds);

  boolean ownsAllHeldSeats(UUID eventId, UUID paymentSessionId, List<UUID> seatIds);

  Map<UUID, List<UUID>> cleanupExpiredHolds();
}
