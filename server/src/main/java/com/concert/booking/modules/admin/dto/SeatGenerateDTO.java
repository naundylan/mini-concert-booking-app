package com.concert.booking.modules.admin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatGenerateDTO {
  @NotNull(message = "ID hạng vé không được để trống")
  UUID ticketClassId;

  @Min(value = 1, message = "Số hàng phải lớn hơn 0")
  @Max(value = 50, message = "Số hàng không được vượt quá 50")
  int totalRows;

  @Min(value = 1, message = "Số cột phải lớn hơn 0")
  @Max(value = 100, message = "Số cột không được vượt quá 100")
  int totalColumns;

  @Size(max = 1, message = "Ký hiệu hàng bắt đầu chỉ gồm 1 ký tự")
  String rowPrefix;
}
