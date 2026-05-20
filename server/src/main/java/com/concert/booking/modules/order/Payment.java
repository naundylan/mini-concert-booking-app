package com.concert.booking.modules.order;

import com.concert.booking.common.entity.AbstractAuditEntity;
import com.concert.booking.modules.order.enums.PaymentMethod;
import com.concert.booking.modules.order.enums.PaymentStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "payments", indexes = @Index(name = "idx_payment_order", columnList = "order_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Payment extends AbstractAuditEntity {

  @Id
  @GeneratedValue
  @UuidGenerator(style = UuidGenerator.Style.TIME)
  UUID id;

  @Column(name = "order_id", nullable = false)
  UUID orderId;

  @Column(name = "transaction_ref", length = 100)
  String transactionRef;

  @Column(nullable = false)
  BigDecimal amount;

  @Enumerated(EnumType.STRING)
  @Column(name = "payment_method", nullable = false, length = 30)
  PaymentMethod paymentMethod;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  PaymentStatus status;
}
