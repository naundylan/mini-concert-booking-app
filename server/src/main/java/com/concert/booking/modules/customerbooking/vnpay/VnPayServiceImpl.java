package com.concert.booking.modules.customerbooking.vnpay;

import com.concert.booking.common.constants.VnPayProperties;
import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.customerbooking.dto.CheckoutSessionDTO;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VnPayServiceImpl implements VnPayService {

  static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
  static final DateTimeFormatter VNPAY_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
  static final String VERSION = "2.1.0";
  static final String COMMAND = "pay";
  static final String CURR_CODE = "VND";
  static final String LOCALE = "vn";
  static final String ORDER_TYPE = "other";
  static final String SUCCESS_CODE = "00";

  VnPayProperties vnPayProperties;

  @Override
  public String createPaymentUrl(CheckoutSessionDTO session, String ipAddress) {
    validateConfigured();

    Map<String, String> params = new TreeMap<>();
    params.put("vnp_Version", VERSION);
    params.put("vnp_Command", COMMAND);
    params.put("vnp_TmnCode", vnPayProperties.getTmnCode());
    params.put("vnp_Amount", toVnPayAmount(session.getTotalAmount()));
    params.put("vnp_CurrCode", CURR_CODE);
    params.put("vnp_TxnRef", session.getPaymentSessionId().toString());
    params.put("vnp_OrderInfo", "Thanh toan ve " + session.getPaymentSessionId());
    params.put("vnp_OrderType", ORDER_TYPE);
    params.put("vnp_Locale", LOCALE);
    params.put("vnp_ReturnUrl", vnPayProperties.getReturnUrl());
    params.put("vnp_IpAddr", ipAddress == null || ipAddress.isBlank() ? "127.0.0.1" : ipAddress);
    params.put("vnp_CreateDate", LocalDateTime.now(VIETNAM_ZONE).format(VNPAY_DATE_FORMAT));

    String secureHash = hmacSha512(vnPayProperties.getHashSecret(), buildHashData(params));
    return vnPayProperties.getPayUrl()
        + "?"
        + buildQuery(params)
        + "&vnp_SecureHash="
        + encode(secureHash);
  }

  @Override
  public boolean isValidSignature(Map<String, String> params) {
    validateConfigured();
    String secureHash = params.get("vnp_SecureHash");
    if (secureHash == null || secureHash.isBlank()) {
      return false;
    }

    Map<String, String> unsignedParams = new TreeMap<>(params);
    unsignedParams.remove("vnp_SecureHash");
    unsignedParams.remove("vnp_SecureHashType");
    String expectedHash = hmacSha512(vnPayProperties.getHashSecret(), buildHashData(unsignedParams));
    return expectedHash.equalsIgnoreCase(secureHash);
  }

  @Override
  public boolean isPaymentSuccess(Map<String, String> params) {
    return SUCCESS_CODE.equals(params.get("vnp_ResponseCode"))
        && SUCCESS_CODE.equals(params.get("vnp_TransactionStatus"));
  }

  @Override
  public UUID getPaymentSessionId(Map<String, String> params) {
    try {
      return UUID.fromString(params.get("vnp_TxnRef"));
    } catch (RuntimeException ex) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Ma giao dich VNPay khong hop le");
    }
  }

  @Override
  public BigDecimal getAmount(Map<String, String> params) {
    try {
      return new BigDecimal(params.get("vnp_Amount")).divide(BigDecimal.valueOf(100), 0, RoundingMode.UNNECESSARY);
    } catch (RuntimeException ex) {
      throw new AppException(HttpStatus.BAD_REQUEST, "So tien VNPay khong hop le");
    }
  }

  private String toVnPayAmount(BigDecimal amount) {
    return amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.UNNECESSARY).toPlainString();
  }

  private String buildHashData(Map<String, String> params) {
    StringBuilder builder = new StringBuilder();
    params.forEach(
        (key, value) -> {
          if (value == null || value.isBlank()) {
            return;
          }
          if (!builder.isEmpty()) {
            builder.append('&');
          }
          builder.append(encode(key)).append('=').append(encode(value));
        });
    return builder.toString();
  }

  private String buildQuery(Map<String, String> params) {
    return buildHashData(params);
  }

  private String hmacSha512(String secret, String data) {
    try {
      Mac hmac = Mac.getInstance("HmacSHA512");
      hmac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
      byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
      StringBuilder builder = new StringBuilder(bytes.length * 2);
      for (byte item : bytes) {
        builder.append(String.format("%02x", item));
      }
      return builder.toString();
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot sign VNPay payload", ex);
    }
  }

  private String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }

  private void validateConfigured() {
    if (isBlank(vnPayProperties.getTmnCode())
        || isBlank(vnPayProperties.getHashSecret())
        || isBlank(vnPayProperties.getPayUrl())
        || isBlank(vnPayProperties.getReturnUrl())) {
      throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "VNPay chua duoc cau hinh");
    }
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
