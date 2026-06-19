package com.concert.booking.modules.ticket;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TicketClassRepository extends JpaRepository<TicketClass, UUID> {
  List<TicketClass> findByEventId(UUID eventId);

  void deleteByEventId(UUID eventId);

  /**
   * Kiểm tra xem ticket class có vé đã bán hay không (Price Locking check) Nếu có 1 vé SOLD cho
   * ticket class này => khóa giá
   */
  @Query(
      "SELECT COUNT(s) > 0 FROM Seat s WHERE s.ticketClassId = :ticketClassId AND s.status = 'SOLD'")
  boolean hasAnySoldSeats(UUID ticketClassId);

  /** Lấy danh sách ticket classes có vé SOLD của một sự kiện */
  @Query(
      "SELECT DISTINCT s.ticketClassId FROM Seat s WHERE s.eventId = :eventId AND s.status = 'SOLD'")
  List<UUID> findTicketClassesWithSoldSeats(UUID eventId);
}
