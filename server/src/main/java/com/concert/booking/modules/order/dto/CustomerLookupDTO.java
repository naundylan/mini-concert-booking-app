package com.concert.booking.modules.order.dto;

import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CustomerLookupDTO {
  boolean found;
  UUID customerId;
  String phone;
  String fullName;
  String email;
  Boolean onlineVerified;
}
