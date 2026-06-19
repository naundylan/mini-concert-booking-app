package com.concert.booking.modules.seat;

import com.concert.booking.common.entity.AbstractAuditEntity;
import com.concert.booking.modules.seat.enums.SeatStatus;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(
    name = "seats",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_seat_event_position",
          columnNames = {"event_id", "grid_row", "grid_column"})
    },
    indexes = {@Index(name = "idx_seats_event_status", columnList = "event_id,status")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Seat extends AbstractAuditEntity {

  @Id
  @GeneratedValue
  @UuidGenerator(style = UuidGenerator.Style.TIME)
  UUID id;

  @Column(name = "event_id", nullable = false)
  UUID eventId;

  @Column(name = "ticket_class_id", nullable = false)
  UUID ticketClassId;

  @Column(name = "grid_row", nullable = false)
  int gridRow;

  @Column(name = "grid_column", nullable = false)
  int gridColumn;

  @Column(length = 30)
  String label;

  @Builder.Default
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  SeatStatus status = SeatStatus.AVAILABLE;

  @Version int version;
}
