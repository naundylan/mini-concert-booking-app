package com.concert.booking.modules.layout.dto;

import com.concert.booking.modules.layout.LayoutStatus;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LayoutResponseDTO {
  UUID id;
  String name;
  String description;
  String venueName;
  LayoutStatus status;
  int workspaceRows;
  int workspaceCols;
  int usedRows;
  int usedCols;
  int seatCount;
  LayoutDataDTO layoutData;
  int version;
  Instant createdAt;
  Instant updatedAt;
}
