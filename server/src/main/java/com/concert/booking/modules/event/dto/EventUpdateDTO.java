package com.concert.booking.modules.event.dto;

import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EventUpdateDTO {

    @Size(max = 255, message = "Tên sự kiện không được vượt quá 255 ký tự")
    String name;

    @Size(max = 500, message = "Địa điểm không được vượt quá 500 ký tự")
    String location;

    @Size(max = 500, message = "URL banner không được vượt quá 500 ký tự")
    String bannerUrl;

    // Chỉ dùng khi DRAFT
    java.sql.Timestamp teasingTime;
    java.sql.Timestamp openTime;
    java.sql.Timestamp startTime;
    java.sql.Timestamp endTime;

    // Status update (CANCELED)
    com.concert.booking.modules.event.enums.EventStatus status;
}