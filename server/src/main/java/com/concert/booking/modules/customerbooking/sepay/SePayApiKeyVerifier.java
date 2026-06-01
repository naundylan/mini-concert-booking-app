package com.concert.booking.modules.customerbooking.sepay;

import com.concert.booking.common.constants.SePayProperties;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SePayApiKeyVerifier implements SePayWebhookVerifier {

  static final String PREFIX = "Apikey ";

  SePayProperties sePayProperties;

  @Override
  public boolean verify(String authorizationHeader) {
    String apiKey = sePayProperties.getApiKey();
    if (apiKey == null || apiKey.isBlank()) {
      return false;
    }
    return (PREFIX + apiKey).equals(authorizationHeader);
  }
}
