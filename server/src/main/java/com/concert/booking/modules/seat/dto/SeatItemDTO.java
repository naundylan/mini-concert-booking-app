package com.concert.booking.modules.seat.dto;

import com.concert.booking.modules.seat.enums.SeatStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatItemDTO {

    UUID id; // ID của ghế (có thể null khi tạo mới)

    @NotNull(message = "ID hạng vé không được để trống")
    UUID ticketClassId;

    @Min(value = 0, message = "Hàng ghế (Row) không hợp lệ")
    int gridRow;

    @Min(value = 0, message = "Cột ghế (Column) không hợp lệ")
    int gridColumn;

    @NotNull(message = "Trạng thái ghế không được để trống")
    SeatStatus status;
}