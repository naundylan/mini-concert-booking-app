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
@ConfigurationProperties(prefix = "application.socket")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SocketIoProperties {
  String hostname = "0.0.0.0";
  int port = 9092;
  String origin = "http://localhost:3000";
}
