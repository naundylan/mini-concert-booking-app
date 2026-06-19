package com.concert.booking.modules.ticket.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TicketClassCreateDTO {

  @NotBlank(message = "Tên hạng vé không được để trống")
  @Size(max = 100, message = "Tên hạng vé không được vượt quá 100 ký tự")
  String name;

  @Size(max = 20, message = "Mã màu không được vượt quá 20 ký tự")
  String colorCode;

  @NotNull(message = "Giá vé không được để trống")
  @Min(value = 0, message = "Giá vé không được âm")
  BigDecimal price;
}
