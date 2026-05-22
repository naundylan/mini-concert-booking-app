package com.concert.booking.modules.layout.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import java.util.ArrayList;
import java.util.List;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LayoutDataDTO {
  @Min(1)
  int workspaceRows;

  @Min(1)
  int workspaceCols;

  String templateType;

  UsedBoundsDTO usedBounds;

  @Valid @Builder.Default List<LayoutCellDTO> cells = new ArrayList<>();

  @Valid @Builder.Default List<LayoutDecorationDTO> decorations = new ArrayList<>();

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  @FieldDefaults(level = AccessLevel.PRIVATE)
  public static class UsedBoundsDTO {
    int minRow;
    int maxRow;
    int minCol;
    int maxCol;
    int usedRows;
    int usedCols;
  }

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  @FieldDefaults(level = AccessLevel.PRIVATE)
  public static class LayoutDecorationDTO {
    String id;
    String type;
    String label;

    @Min(0)
    int row;

    @Min(0)
    int col;

    @Min(1)
    int rowSpan;

    @Min(1)
    int colSpan;

    String shape;
  }
}
