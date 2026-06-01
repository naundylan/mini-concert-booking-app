package com.concert.booking.common.constants;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "application.payment.bank")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BankTransferProperties {
  String accountNumber = "0000000000";
  String accountName = "MINI CONCERT BOOKING";
}
