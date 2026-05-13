package com.concert.booking.modules.booking.dto;

import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PosCustomerLookupResponse {
  boolean found;
  UUID customerId;
  String phone;
  String fullName;
  String email;
  Boolean onlineVerified;
}
