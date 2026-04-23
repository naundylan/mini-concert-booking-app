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
@ConfigurationProperties(prefix = "cloudinary")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CloudinaryProperties {
    String cloudName;
    String apiKey;
    String apiSecret;
    String folder;
}