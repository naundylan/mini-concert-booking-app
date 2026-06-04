package com.concert.booking.common.constants;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "application.payment.vietqr")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VietQrProperties {
  String bankId;
  String accountNo;
  String accountName;
  String template;
}
