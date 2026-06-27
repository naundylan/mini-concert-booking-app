package com.concert.booking.modules.customerbooking.dto;

import java.time.Instant;
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
public class CustomerSeatCatalogDTO {
  UUID eventId;
  String eventName;
  String layoutTemplateType;
  List<com.concert.booking.modules.layout.dto.LayoutDataDTO.LayoutDecorationDTO> layoutDecorations;
  Instant generatedAt;
  List<CustomerSeatDTO> seats;
}
