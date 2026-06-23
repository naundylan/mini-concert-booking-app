package com.concert.booking.modules.seat;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.seat.enums.SeatStatus;
import com.concert.booking.modules.seat.redis.SeatHoldRedisService;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class SeatHoldServiceTest {

  @Mock SeatRepository seatRepository;
  @Mock SeatHoldRedisService seatHoldRedisService;

  @InjectMocks SeatHoldServiceImpl seatHoldService;

  private UUID eventId;
  private UUID seatId1;
  private UUID seatId2;
  private List<UUID> seatIds;
  private Seat seat1;
  private Seat seat2;

  @BeforeEach
  void setUp() {
    eventId = UUID.randomUUID();
    seatId1 = UUID.randomUUID();
    seatId2 = UUID.randomUUID();
    seatIds = java.util.stream.Stream.of(seatId1, seatId2).sorted().toList();

    seat1 =
        Seat.builder()
            .id(seatId1)
            .eventId(eventId)
            .gridRow(0)
            .gridColumn(1)
            .label("A2")
            .status(SeatStatus.AVAILABLE)
            .build();

    seat2 =
        Seat.builder()
            .id(seatId2)
            .eventId(eventId)
            .gridRow(0)
            .gridColumn(2)
            .label("A3")
            .status(SeatStatus.AVAILABLE)
            .build();
  }

  @Test
  void lockAvailableSeats_success_shouldReturnSeats() {
    // Arrange
    when(seatRepository.findAllByIdForUpdate(anyList())).thenReturn(List.of(seat1, seat2));
    when(seatHoldRedisService.hasAnyHeldSeat(eventId, seatIds)).thenReturn(false);

    // Act
    List<Seat> result = seatHoldService.lockAvailableSeats(eventId, seatIds);

    // Assert
    assertNotNull(result);
    assertEquals(2, result.size());
    verify(seatRepository, times(1)).findAllByIdForUpdate(anyList());
    verify(seatHoldRedisService, times(1)).hasAnyHeldSeat(eventId, seatIds);
  }

  @Test
  void lockAvailableSeats_invalidSeatListSize_shouldThrowBadRequest() {
    // Arrange: Repository returns only 1 seat instead of 2
    when(seatRepository.findAllByIdForUpdate(anyList())).thenReturn(List.of(seat1));

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> {
              seatHoldService.lockAvailableSeats(eventId, seatIds);
            });

    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    assertEquals("Danh sách ghế không hợp lệ", exception.getMessage());
  }

  @Test
  void lockAvailableSeats_seatNotAvailable_shouldThrowConflict() {
    // Arrange: Seat 2 is already SOLD
    seat2.setStatus(SeatStatus.SOLD);
    when(seatRepository.findAllByIdForUpdate(anyList())).thenReturn(List.of(seat1, seat2));

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> {
              seatHoldService.lockAvailableSeats(eventId, seatIds);
            });

    assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
    assertTrue(exception.getMessage().contains("Các ghế không còn khả dụng"));
  }

  @Test
  void lockAvailableSeats_seatHeldInRedis_shouldThrowConflict() {
    // Arrange: Held in Redis by another session
    when(seatRepository.findAllByIdForUpdate(anyList())).thenReturn(List.of(seat1, seat2));
    when(seatHoldRedisService.hasAnyHeldSeat(eventId, seatIds)).thenReturn(true);

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> {
              seatHoldService.lockAvailableSeats(eventId, seatIds);
            });

    assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
    assertEquals("Một số ghế đang được giữ bởi người khác", exception.getMessage());
  }

  @Test
  void release_success_shouldChangeLockedSeatsToAvailable() {
    // Arrange: Both seats are currently LOCKED
    seat1.setStatus(SeatStatus.LOCKED);
    seat2.setStatus(SeatStatus.LOCKED);
    when(seatRepository.findAllById(seatIds)).thenReturn(List.of(seat1, seat2));

    // Act
    seatHoldService.release(seatIds);

    // Assert
    assertEquals(SeatStatus.AVAILABLE, seat1.getStatus());
    assertEquals(SeatStatus.AVAILABLE, seat2.getStatus());
    verify(seatRepository, times(1)).saveAll(anyList());
  }
}
