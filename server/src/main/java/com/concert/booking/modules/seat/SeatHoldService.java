package com.concert.booking.modules.seat;

import java.util.List;
import java.util.UUID;

public interface SeatHoldService {
  List<Seat> lockAvailableSeats(UUID eventId, List<UUID> seatIds);

  void confirmSold(List<Seat> seats, UUID updatedBy);

  void release(List<UUID> seatIds);
}
