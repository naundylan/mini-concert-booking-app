package com.concert.booking.common.constants;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "application.payment.sepay")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SePayProperties {
  String apiKey;
  String merchantAccount;
}
