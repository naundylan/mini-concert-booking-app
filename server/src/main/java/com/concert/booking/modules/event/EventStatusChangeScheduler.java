package com.concert.booking.modules.event;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Scheduler tự động chuyển trạng thái sự kiện mỗi phút.
 *
 * <p>Quy trình: DRAFT -> TEASING tại teasingTime, TEASING -> ONSALE tại openTime, ONSALE ->
 * ENDED tại startTime để dừng bán vé khi sự kiện bắt đầu.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EventStatusChangeScheduler {
  EventStatusTransitionService eventStatusTransitionService;

  /** Cron: 0 * * * * * = giây 0 của mỗi phút. */
  @Scheduled(cron = "0 * * * * *")
  public void checkAndUpdateEventStatus() {
    log.debug("Start scheduled event status transition sync");
    eventStatusTransitionService.syncEventStatuses();
    log.debug("Finished scheduled event status transition sync");
  }
}
