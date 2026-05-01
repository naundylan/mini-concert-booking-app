package com.concert.booking.modules.event.dto;

import com.concert.booking.modules.event.enums.EventStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EventStatusUpdateDTO {

    @NotNull(message = "Trạng thái sự kiện không được để trống")
    EventStatus status;
}