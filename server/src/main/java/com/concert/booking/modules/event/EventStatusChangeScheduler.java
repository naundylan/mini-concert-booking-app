package com.concert.booking.modules.event;

import com.concert.booking.modules.event.enums.EventStatus;
import java.sql.Timestamp;
import java.util.List;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scheduler để tự động chuyển đổi trạng thái sự kiện mỗi phút
 * Dựa trên thời gian cấu hình: teasingTime, openTime, startTime, endTime
 *
 * Quy trình:
 * - DRAFT + teasingTime <= now => TEASING
 * - TEASING + openTime <= now => ONSALE
 * - ONSALE + endTime <= now => ENDED
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EventStatusChangeScheduler {

    EventRepository eventRepository;

    /**
     * Quét mỗi phút để cập nhật trạng thái sự kiện
     * Cron: 0 * * * * * = mỗi 0 giây của mỗi phút (mỗi phút)
     */
    @Scheduled(cron = "0 */10 * * * *")
    @Transactional
    public void checkAndUpdateEventStatus() {
        Timestamp now = new Timestamp(System.currentTimeMillis());
        log.debug("Bắt đầu kiểm tra và cập nhật trạng thái sự kiện - Time: {}", now);

        // Step 1: DRAFT -> TEASING at teasingTime
        checkDraftToTeasing(now);

        // Step 2: TEASING -> ONSALE at openTime
        checkTeasingToOnSale(now);

        // Step 3: ONSALE -> ENDED at endTime
        checkOnSaleToEnded(now);

        log.debug("Hoàn tất kiểm tra và cập nhật trạng thái sự kiện");
    }

    private void checkDraftToTeasing(Timestamp now) {
        List<Event> draftEvents = eventRepository.findEventsToTease(EventStatus.DRAFT, now);
        for (Event event : draftEvents) {
            event.setStatus(EventStatus.TEASING);
            eventRepository.save(event);
            log.info("Cập nhật sự kiện [{}] từ DRAFT sang TEASING", event.getId());
        }
    }

    private void checkTeasingToOnSale(Timestamp now) {
        List<Event> teasingEvents = eventRepository.findEventsToOpen(EventStatus.TEASING, now);
        for (Event event : teasingEvents) {
            event.setStatus(EventStatus.ONSALE);
            eventRepository.save(event);
            log.info("Cập nhật sự kiện [{}] từ TEASING sang ONSALE", event.getId());
        }
    }

    private void checkOnSaleToEnded(Timestamp now) {
        List<Event> onSaleEvents = eventRepository.findEventsToEnd(EventStatus.ONSALE, now);
        for (Event event : onSaleEvents) {
            event.setStatus(EventStatus.ENDED);
            eventRepository.save(event);
            log.info("Cập nhật sự kiện [{}] từ ONSALE sang ENDED", event.getId());
        }
    }
}
