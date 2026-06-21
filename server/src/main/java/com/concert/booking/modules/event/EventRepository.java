package com.concert.booking.modules.event;

import com.concert.booking.modules.event.enums.EventStatus;
import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends JpaRepository<Event, UUID> {
  @Query("SELECT COUNT(e) FROM Event e WHERE e.status IN (com.concert.booking.modules.event.enums.EventStatus.ONSALE, com.concert.booking.modules.event.enums.EventStatus.TEASING)")
  long countActiveEvents();

  @Query("SELECT e FROM Event e WHERE e.status = :status AND e.teasingTime <= :now")
  List<Event> findEventsToTease(EventStatus status, Timestamp now);

  @Query("SELECT e FROM Event e WHERE e.status = :status AND e.openTime <= :now")
  List<Event> findEventsToOpen(EventStatus status, Timestamp now);

  @Query("SELECT e FROM Event e WHERE e.status = :status AND e.startTime <= :now")
  List<Event> findEventsToEndSale(EventStatus status, Timestamp now);

  @Query(
      """
        SELECT e FROM Event e
        WHERE e.endTime >= :now
          AND e.status IN :statuses
        """)
  List<Event> findCheckInCandidates(List<EventStatus> statuses, Timestamp now);

  /** Lấy danh sách tất cả sự kiện */
  List<Event> findAll();

  List<Event> findByStatus(EventStatus status);

  @Query(
      """
        SELECT e
        FROM Event e
        WHERE e.status IN :statuses
          AND (
            :keyword = ''
            OR LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(e.location) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
        ORDER BY e.startTime ASC
        """)
  Page<Event> findCustomerVisibleEvents(
      @Param("keyword") String keyword,
      @Param("statuses") List<EventStatus> statuses,
      Pageable pageable);
}
