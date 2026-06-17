package com.concert.booking.modules.seat;

import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.seat.enums.SeatStatus;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationAdapter;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SeatHoldServiceImpl implements SeatHoldService {
  SeatRepository seatRepository;
  SeatHoldRedisService seatHoldRedisService;

  @Transactional
  public List<Seat> lockAvailableSeats(UUID eventId, List<UUID> seatIds) {
    // Sort and deduplicate seat IDs for deterministic locking
    List<UUID> sortedSeatIds = seatIds.stream().distinct().sorted().toList();
    // Pessimistic lock on DB rows
    List<Seat> seats = seatRepository.findAllByIdForUpdate(sortedSeatIds);
    if (seats.size() != sortedSeatIds.size()) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Danh sách ghế không hợp lệ");
    }
    // Validate seat availability
    List<Seat> conflictedSeats = seats.stream()
        .filter(seat -> !eventId.equals(seat.getEventId()) || seat.getStatus() != SeatStatus.AVAILABLE)
        .toList();
    if (!conflictedSeats.isEmpty()) {
      String conflicts = conflictedSeats.stream()
          .map(seat -> toSeatLabel(seat) + "(" + seat.getStatus() + ")")
          .collect(java.util.stream.Collectors.joining(", "));
      throw new AppException(HttpStatus.CONFLICT,
          "Các ghế không còn khả dụng hoặc không thuộc sự kiện đang bán: " + conflicts);
    }
    // Register Redis lock to execute only after DB transaction commits successfully
    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronizationAdapter() {
      @Override
      public void afterCommit() {
        seatHoldRedisService.lockSeats(eventId, sortedSeatIds);
      }
    });
    return seats;
  }

  @Override
  public void confirmSold(List<Seat> seats, UUID updatedBy) {
    // POS offline: staff xác nhận thanh toán trực tiếp nên ghế đi thẳng AVAILABLE -> SOLD.
    // HELD/Redis TTL dành cho luồng online booking sau này.
    seats.forEach(
        seat -> {
          seat.setStatus(SeatStatus.SOLD);
          seat.setUpdatedBy(updatedBy);
        });
    seatRepository.saveAll(seats);
  }

  @Override
  public void release(List<UUID> seatIds) {
    log.warn("SeatHoldService.release() called but not yet implemented. seatIds={}", seatIds);
    throw new UnsupportedOperationException(
        "release() chưa được implement — dành cho online booking flow");
  }

  private String toSeatLabel(Seat seat) {
    if (seat.getLabel() != null && !seat.getLabel().isBlank()) {
      return seat.getLabel();
    }
    return (char) ('A' + seat.getGridRow()) + String.valueOf(seat.getGridColumn() + 1);
  }
}
