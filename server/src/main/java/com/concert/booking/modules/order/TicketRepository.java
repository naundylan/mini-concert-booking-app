package com.concert.booking.modules.order;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
  List<Ticket> findByOrderId(UUID orderId);

  long countByOrderId(UUID orderId);

  @Query("SELECT COUNT(t) FROM Ticket t JOIN Order o ON o.id = t.orderId WHERE o.status = com.concert.booking.modules.order.enums.OrderStatus.PAID AND o.createdAt >= :start AND o.createdAt < :end")
  long countTicketsSoldBetween(@Param("start") Instant start, @Param("end") Instant end);

  @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = com.concert.booking.modules.order.enums.TicketStatus.USED")
  long countUsedTickets();

  @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status IN (com.concert.booking.modules.order.enums.TicketStatus.USED, com.concert.booking.modules.order.enums.TicketStatus.UNUSED)")
  long countTotalPaidTickets();



  @Query(
      """
      SELECT t
      FROM Ticket t
      JOIN Order o ON o.id = t.orderId
      WHERE o.customerId = :customerId
      ORDER BY t.createdAt DESC
      """)
  Page<Ticket> findCustomerTickets(@Param("customerId") UUID customerId, Pageable pageable);

  @Query(
      """
      SELECT t
      FROM Ticket t
      JOIN Order o ON o.id = t.orderId
      JOIN User customer ON customer.id = o.customerId
      WHERE t.status = com.concert.booking.modules.order.enums.TicketStatus.USED
        AND t.checkInTime IS NOT NULL
        AND t.checkInBy = :staffId
        AND (:eventId IS NULL OR o.eventId = :eventId)
        AND (
          :keyword IS NULL
          OR :keyword = ''
          OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
          OR LOWER(customer.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
          OR customer.phone LIKE CONCAT('%', :keyword, '%')
          OR LOWER(t.seatLabel) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
      ORDER BY t.checkInTime DESC
      """)
  List<Ticket> findCheckInHistory(
      @Param("eventId") UUID eventId,
      @Param("keyword") String keyword,
      @Param("staffId") UUID staffId,
      Pageable pageable);
}
