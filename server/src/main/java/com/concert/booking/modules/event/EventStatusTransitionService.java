package com.concert.booking.modules.event;

import com.concert.booking.modules.event.enums.EventStatus;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EventStatusTransitionService {
  EventRepository eventRepository;

  @Transactional
  public void syncEventStatuses() {
    syncEventStatuses(Timestamp.from(Instant.now()));
  }

  @Transactional
  public void syncEventStatuses(Timestamp now) {
    checkDraftToTeasing(now);
    checkTeasingToOnSale(now);
    checkOnSaleToEnded(now);
  }

  private void checkDraftToTeasing(Timestamp now) {
    List<Event> draftEvents = eventRepository.findEventsToTease(EventStatus.DRAFT, now);
    for (Event event : draftEvents) {
      event.setStatus(EventStatus.TEASING);
      eventRepository.save(event);
      log.info("Updated event [{}] from DRAFT to TEASING", event.getId());
    }
  }

  private void checkTeasingToOnSale(Timestamp now) {
    List<Event> teasingEvents = eventRepository.findEventsToOpen(EventStatus.TEASING, now);
    for (Event event : teasingEvents) {
      event.setStatus(EventStatus.ONSALE);
      eventRepository.save(event);
      log.info("Updated event [{}] from TEASING to ONSALE", event.getId());
    }
  }

  private void checkOnSaleToEnded(Timestamp now) {
    List<Event> onSaleEvents = eventRepository.findEventsToEndSale(EventStatus.ONSALE, now);
    for (Event event : onSaleEvents) {
      event.setStatus(EventStatus.ENDED);
      eventRepository.save(event);
      log.info("Updated event [{}] from ONSALE to ENDED at startTime", event.getId());
    }
  }
}
