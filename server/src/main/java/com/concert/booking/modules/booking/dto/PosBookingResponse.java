package com.concert.booking.modules.booking.dto;

import com.concert.booking.modules.booking.enums.BookingStatus;
import com.concert.booking.modules.booking.enums.PaymentMethod;
import com.concert.booking.modules.booking.enums.PaymentStatus;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PosBookingResponse {
  UUID bookingId;
  String bookingCode;
  UUID customerId;
  BookingStatus status;
  PaymentMethod paymentMethod;
  PaymentStatus paymentStatus;
  BigDecimal totalAmount;
  BigDecimal amountReceived;
  List<String> seatLabels;
  String paymentUrl;
}
