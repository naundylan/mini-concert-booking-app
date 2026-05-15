package com.concert.booking.modules.admin.dto;

import com.concert.booking.modules.seat.enums.SeatStatus;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatUpdateDTO {
  UUID ticketClassId;
  SeatStatus status;
}
