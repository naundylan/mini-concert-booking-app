package com.concert.booking.modules.layout;

import com.concert.booking.common.entity.AbstractAuditEntity;
import com.concert.booking.modules.layout.dto.LayoutDataDTO;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

@Entity
@Table(
    name = "seat_layouts",
    indexes = {
      @Index(name = "idx_seat_layout_status", columnList = "status"),
      @Index(name = "idx_seat_layout_name", columnList = "name")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatLayout extends AbstractAuditEntity {
  @Id
  @GeneratedValue
  @UuidGenerator(style = UuidGenerator.Style.TIME)
  UUID id;

  @Column(nullable = false, length = 150)
  String name;

  @Column(length = 500)
  String description;

  @Column(name = "venue_name", length = 150)
  String venueName;

  @Builder.Default
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  LayoutStatus status = LayoutStatus.DRAFT;

  @Column(name = "workspace_rows", nullable = false)
  int workspaceRows;

  @Column(name = "workspace_cols", nullable = false)
  int workspaceCols;

  @Column(name = "used_rows", nullable = false)
  int usedRows;

  @Column(name = "used_cols", nullable = false)
  int usedCols;

  @Column(name = "seat_count", nullable = false)
  int seatCount;

  // previewLabel in layoutData.cells is only for editor display.
  // The official seat label is recomputed when applying the layout into event seats.
  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "layout_data", nullable = false, columnDefinition = "jsonb")
  LayoutDataDTO layoutData;

  @Version int version;
}
