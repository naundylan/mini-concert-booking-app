package com.concert.booking.modules.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.sql.Timestamp;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EventCreateDTO {

    @NotBlank(message = "Tên sự kiện không được để trống")
    @Size(max = 255, message = "Tên sự kiện không được vượt quá 255 ký tự")
    String name;

    @NotBlank(message = "Địa điểm không được để trống")
    @Size(max = 500, message = "Địa điểm không được vượt quá 500 ký tự")
    String location;

    @Size(max = 500, message = "URL banner không được vượt quá 500 ký tự")
    String bannerUrl;

    @NotNull(message = "Thời gian Teasing không được để trống")
    Timestamp teasingTime;

    @NotNull(message = "Thời gian mở bán không được để trống")
    Timestamp openTime;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    Timestamp startTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    Timestamp endTime;
}