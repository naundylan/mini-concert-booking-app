package com.concert.booking.modules.customerbooking.socket;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatHeldSocketEvent {
  UUID eventId;
  List<UUID> seatIds;
  Instant expiresAt;
}
