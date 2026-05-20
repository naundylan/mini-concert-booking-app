package com.concert.booking.modules.seat;

import com.concert.booking.modules.seat.enums.SeatStatus;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface SeatRepository extends JpaRepository<Seat, UUID> {
    List<Seat> findByEventId(UUID eventId);
    List<Seat> findByTicketClassId(UUID ticketClassId);
    boolean existsByEventIdAndStatus(UUID eventId, SeatStatus status);
    boolean existsByEventIdAndGridRowAndGridColumn(UUID eventId, int gridRow, int gridColumn);
    void deleteByEventId(UUID eventId);

    /**
     * Kiểm tra xem có ghế SOLD nào cho ticket class cụ thể hay không (Layout Safety check)
     */
    @Query("SELECT COUNT(s) > 0 FROM Seat s WHERE s.ticketClassId = :ticketClassId AND s.status = 'SOLD'")
    boolean hasSoldSeatsForTicketClass(UUID ticketClassId);

    /**
     * Lấy danh sách ghế có trạng thái SOLD cho một sự kiện
     */
    @Query("SELECT s FROM Seat s WHERE s.eventId = :eventId AND s.status = 'SOLD'")
    List<Seat> findSoldSeatsByEventId(UUID eventId);

    /**
     * Đếm ghế SOLD theo ticket class (để kiểm tra Price Locking)
     */
    @Query("SELECT COUNT(s) FROM Seat s WHERE s.ticketClassId = :ticketClassId AND s.status = 'SOLD'")
    long countSoldSeatsByTicketClass(UUID ticketClassId);

    /**
     * Kiểm tra xem có ghế MAINTENANCE nào cho sự kiện hay không
     */
    @Query("SELECT COUNT(s) > 0 FROM Seat s WHERE s.eventId = :eventId AND s.status = 'MAINTENANCE'")
    boolean hasMaintenanceSeats(UUID eventId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Seat s WHERE s.id IN :seatIds ORDER BY s.id")
    List<Seat> findAllByIdForUpdate(List<UUID> seatIds);
}
