package com.concert.booking.modules.checkin.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TicketCheckInRequestDTO {
  @NotNull(message = "eventId là bắt buộc")
  UUID eventId;
}
