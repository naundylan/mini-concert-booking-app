package com.concert.booking.modules.order;

import com.concert.booking.common.entity.AbstractAuditEntity;
import com.concert.booking.modules.order.enums.OrderStatus;
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
    name = "orders",
    indexes = {
      @Index(name = "idx_order_code", columnList = "order_code"),
      @Index(name = "idx_order_customer", columnList = "customer_id"),
      @Index(name = "idx_order_event", columnList = "event_id")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Order extends AbstractAuditEntity {

  @Id
  @GeneratedValue
  @UuidGenerator(style = UuidGenerator.Style.TIME)
  UUID id;

  @Column(name = "customer_id", nullable = false)
  UUID customerId;

  @Column(name = "event_id", nullable = false)
  UUID eventId;

  @Column(name = "staff_id", nullable = false)
  UUID staffId;

  @Column(name = "order_code", nullable = false, unique = true, length = 10)
  String orderCode;

  @Column(name = "total_amount", nullable = false)
  BigDecimal totalAmount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  OrderStatus status;

  @Column(name = "expired_at")
  Timestamp expiredAt;

  @Version int version;
}
