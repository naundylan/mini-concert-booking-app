package com.concert.booking.modules.customerbooking.vnpay;

import com.concert.booking.modules.customerbooking.dto.CheckoutSessionDTO;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public interface VnPayService {
  String createPaymentUrl(CheckoutSessionDTO session, String ipAddress);

  boolean isValidSignature(Map<String, String> params);

  boolean isPaymentSuccess(Map<String, String> params);

  UUID getPaymentSessionId(Map<String, String> params);

  BigDecimal getAmount(Map<String, String> params);
}
