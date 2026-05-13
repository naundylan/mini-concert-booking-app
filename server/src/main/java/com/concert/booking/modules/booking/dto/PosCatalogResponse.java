package com.concert.booking.modules.booking.dto;

import java.util.List;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PosCatalogResponse {
  UUID eventId;
  String eventName;
  List<PosTicketClassResponse> ticketClasses;
  List<PosSeatResponse> seats;
}
