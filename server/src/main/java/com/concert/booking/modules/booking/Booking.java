package com.concert.booking.modules.booking;

import com.concert.booking.common.entity.AbstractAuditEntity;
import com.concert.booking.modules.booking.enums.BookingStatus;
import com.concert.booking.modules.booking.enums.PaymentMethod;
import com.concert.booking.modules.booking.enums.PaymentStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(
    name = "bookings",
    indexes = {
      @Index(name = "idx_booking_code", columnList = "booking_code"),
      @Index(name = "idx_booking_customer", columnList = "customer_id"),
      @Index(name = "idx_booking_event", columnList = "event_id")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Booking extends AbstractAuditEntity {

  @Id
  @GeneratedValue
  @UuidGenerator(style = UuidGenerator.Style.TIME)
  UUID id;

  @Column(name = "booking_code", nullable = false, unique = true, length = 10)
  String bookingCode;

  @Column(name = "event_id", nullable = false)
  UUID eventId;

  @Column(name = "customer_id", nullable = false)
  UUID customerId;

  @Column(name = "staff_id", nullable = false)
  UUID staffId;

  @Column(name = "customer_phone", nullable = false, length = 20)
  String customerPhone;

  @Column(name = "customer_name", nullable = false, length = 255)
  String customerName;

  @Column(name = "customer_email", length = 255)
  String customerEmail;

  @Column(name = "total_amount", nullable = false)
  BigDecimal totalAmount;

  @Column(name = "amount_received")
  BigDecimal amountReceived;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  BookingStatus status;

  @Enumerated(EnumType.STRING)
  @Column(name = "payment_method", nullable = false, length = 30)
  PaymentMethod paymentMethod;

  @Enumerated(EnumType.STRING)
  @Column(name = "payment_status", nullable = false, length = 40)
  PaymentStatus paymentStatus;
}
