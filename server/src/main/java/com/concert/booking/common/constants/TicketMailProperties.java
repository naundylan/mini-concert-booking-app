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
@ConfigurationProperties(prefix = "application.ticket-mail")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TicketMailProperties {
  boolean enabled = true;
  String deliveryMode = "auto";
  int highLoadActiveRequests = 80;
  String subject = "Ve cua ban - Mini Concert Booking";
  long retryInitialDelayMs = 2000L;
  double retryMultiplier = 1.5;
  int retryMaxAttempts = 3;
}
