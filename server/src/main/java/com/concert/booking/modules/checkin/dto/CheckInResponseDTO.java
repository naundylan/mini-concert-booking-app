package com.concert.booking.modules.checkin.dto;

import com.concert.booking.modules.checkin.CheckInResultStatus;
import java.sql.Timestamp;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckInResponseDTO {
  CheckInResultStatus result;
  String message;
  UUID orderId;
  String orderCode;
  UUID eventId;
  UUID customerId;
  String customerName;
  String phone;
  CheckInTicketDTO ticket;
  Timestamp checkedAt;
  UUID checkInBy;
  String checkInByName;
}
