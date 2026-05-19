package com.concert.booking.modules.checkin.dto;

import com.concert.booking.modules.event.enums.EventStatus;
import java.sql.Timestamp;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckInEventDTO {
  UUID id;
  String name;
  String location;
  String bannerUrl;
  Timestamp startTime;
  Timestamp endTime;
  EventStatus status;
}
