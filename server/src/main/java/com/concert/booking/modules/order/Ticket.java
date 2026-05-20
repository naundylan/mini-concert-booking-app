package com.concert.booking.modules.order;

import com.concert.booking.common.entity.AbstractAuditEntity;
import com.concert.booking.modules.order.enums.TicketStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(
    name = "tickets",
    uniqueConstraints = {
      @UniqueConstraint(name = "uk_ticket_seat", columnNames = "seat_id")
    },
    indexes = {
      @Index(name = "idx_ticket_order", columnList = "order_id"),
      @Index(name = "idx_ticket_seat", columnList = "seat_id")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Ticket extends AbstractAuditEntity {

  @Id
  @GeneratedValue
  @UuidGenerator(style = UuidGenerator.Style.TIME)
  UUID id;

  @Column(name = "order_id", nullable = false)
  UUID orderId;

  @Column(name = "seat_id", nullable = false)
  UUID seatId;

  @Column(name = "ticket_class_id", nullable = false)
  UUID ticketClassId;

  @Column(name = "seat_label", nullable = false, length = 20)
  String seatLabel;

  @Column(name = "check_in_by")
  UUID checkInBy;

  @Column(nullable = false)
  BigDecimal price;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  TicketStatus status;

  @Column(name = "check_in_time")
  Timestamp checkInTime;

  @Version int version;
}
