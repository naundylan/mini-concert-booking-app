package com.concert.booking.modules.customerbooking.socket;

import com.concert.booking.modules.customerbooking.redis.SeatHoldRedisService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SeatHoldExpirationScheduler {

  SeatHoldRedisService seatHoldRedisService;
  SeatSocketService seatSocketService;

  @Scheduled(fixedDelay = 1000)
  public void releaseExpiredSeatHolds() {
    Map<UUID, List<UUID>> releasedSeatIdsByEvent = seatHoldRedisService.cleanupExpiredHolds();
    releasedSeatIdsByEvent.forEach(seatSocketService::emitSeatReleased);
  }
}
