package com.concert.booking.modules.seat.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatLayoutDTO {

  @NotEmpty(message = "Danh sách ghế không được để trống")
  @Valid
  List<SeatItemDTO> seats;
}
