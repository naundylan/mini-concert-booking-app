package com.concert.booking.modules.customerbooking.dto;

import com.concert.booking.modules.event.enums.EventStatus;
import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CustomerEventDetailDTO {
  UUID id;
  String name;
  String location;
  String bannerUrl;
  Timestamp teasingTime;
  Timestamp openTime;
  Timestamp startTime;
  Timestamp endTime;
  EventStatus status;
  List<CustomerTicketClassDTO> ticketClasses;
  SeatSummaryDTO seatSummary;
  String description;
}
