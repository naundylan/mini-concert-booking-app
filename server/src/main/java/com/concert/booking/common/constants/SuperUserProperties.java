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
@ConfigurationProperties(prefix = "application.admin")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SuperUserProperties {
  String username;
  String password;
  String email;
  String fullName;
  String phone;
}
