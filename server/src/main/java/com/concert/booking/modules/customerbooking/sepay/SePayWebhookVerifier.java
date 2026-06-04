package com.concert.booking.modules.customerbooking.sepay;

public interface SePayWebhookVerifier {
  boolean verify(String authorizationHeader);
}
