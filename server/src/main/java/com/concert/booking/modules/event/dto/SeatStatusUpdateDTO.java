package com.concert.booking.modules.event.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatStatusUpdateDTO {

  @NotBlank(message = "Trạng thái ghế không được để trống")
  String status; // AVAILABLE, MAINTENANCE, SOLD, LOCKED
}
