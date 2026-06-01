package com.concert.booking.modules.customerbooking.socket;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class JoinEventRequest {
  String eventId;
}
