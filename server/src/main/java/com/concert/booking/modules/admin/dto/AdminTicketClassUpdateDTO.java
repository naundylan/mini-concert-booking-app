package com.concert.booking.modules.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminTicketClassUpdateDTO {
  @Size(max = 100, message = "Tên hạng vé không được vượt quá 100 ký tự")
  String name;

  @Size(max = 20, message = "Mã màu không được vượt quá 20 ký tự")
  String colorCode;

  @Min(value = 0, message = "Giá vé không được âm")
  BigDecimal price;
}
