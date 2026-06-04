package com.concert.booking.modules.customerbooking.dto;

import com.concert.booking.modules.order.enums.PaymentMethod;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckoutPaymentStatusDTO {
  String status;
  PaymentMethod paymentMethod;
  UUID orderId;
}
