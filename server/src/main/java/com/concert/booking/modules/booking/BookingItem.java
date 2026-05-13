package com.concert.booking.modules.booking;

import com.concert.booking.common.entity.AbstractAuditEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(
    name = "booking_items",
    indexes = {
      @Index(name = "idx_booking_item_booking", columnList = "booking_id"),
      @Index(name = "idx_booking_item_seat", columnList = "seat_id")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingItem extends AbstractAuditEntity {

  @Id
  @GeneratedValue
  @UuidGenerator(style = UuidGenerator.Style.TIME)
  UUID id;

  @Column(name = "booking_id", nullable = false)
  UUID bookingId;

  @Column(name = "seat_id", nullable = false)
  UUID seatId;

  @Column(name = "ticket_class_id", nullable = false)
  UUID ticketClassId;

  @Column(name = "seat_label", nullable = false, length = 20)
  String seatLabel;

  @Column(nullable = false)
  BigDecimal price;
}
