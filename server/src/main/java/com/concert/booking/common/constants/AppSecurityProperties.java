package com.concert.booking.common.constants;

import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "application.security")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AppSecurityProperties {
  String frontendUrl = "http://localhost:3000";
  List<String> corsAllowedOrigins = List.of(
      "http://localhost:3000",
      "http://localhost:*",
      "http://172.21.240.1:*",
      "http://114.29.236.199:*",
      "https://*.app.github.dev"
  );
  String oauth2FrontendRedirectUrl = "http://localhost:3000/auth/callback";
}
