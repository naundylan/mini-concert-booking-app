package com.concert.booking.modules.layout.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LayoutCellDTO {
  @Min(0)
  int row;

  @Min(0)
  int col;

  // Editor-only preview. Seat labels are recomputed by the backend during apply.
  String previewLabel;

  @NotBlank String ticketClassKey;

  @Builder.Default Boolean customPreviewLabel = false;
}
