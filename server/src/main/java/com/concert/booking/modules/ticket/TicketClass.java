package com.concert.booking.modules.ticket;

import com.concert.booking.common.entity.AbstractAuditEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "ticket_classes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TicketClass extends AbstractAuditEntity {

  @Id
  @GeneratedValue
  @UuidGenerator(style = UuidGenerator.Style.TIME)
  UUID id;

  @Column(name = "event_id", nullable = false)
  UUID eventId;

  @Column(nullable = false, length = 100)
  String name;

  @Column(name = "color_code", length = 20)
  String colorCode;

  @Column(nullable = false)
  BigDecimal price;

  @Version int version;
}
