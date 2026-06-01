package com.concert.booking.common.constants;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "application.payment.vnpay")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VnPayProperties {
  String tmnCode;
  String hashSecret;
  String payUrl;
  String returnUrl;
  String ipnUrl;
}
