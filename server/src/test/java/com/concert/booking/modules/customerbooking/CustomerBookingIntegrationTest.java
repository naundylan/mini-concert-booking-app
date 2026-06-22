package com.concert.booking.modules.customerbooking;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.concert.booking.BaseIntegrationTest;
import com.concert.booking.modules.auth.security.CustomUserDetails;
import com.concert.booking.modules.customerbooking.dto.*;
import com.concert.booking.modules.user.User;
import com.concert.booking.modules.user.enums.UserRole;
import com.concert.booking.modules.user.enums.UserStatus;
import com.concert.booking.modules.order.enums.PaymentMethod;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;

class CustomerBookingIntegrationTest extends BaseIntegrationTest {

  @Autowired ObjectMapper objectMapper;

  @MockBean CustomerBookingService customerBookingService;

  private CustomUserDetails customerDetails;
  private UUID customerId;

  @BeforeEach
  void setUp() {
    customerId = UUID.randomUUID();
    User customer =
        User.builder()
            .id(customerId)
            .username("customer1")
            .role(UserRole.CUSTOMER)
            .status(UserStatus.ACTIVE)
            .build();
    customerDetails = new CustomUserDetails(customer);
  }

  @Test
  void handleSePayWebhook_success_shouldReturnMap() throws Exception {
    // Arrange
    SePayWebhookDTO webhookDTO = SePayWebhookDTO.builder()
        .id(12345L)
        .gateway("VCB")
        .transferAmount(new BigDecimal("500000"))
        .content("SEVQR ORD12345")
        .transferType("IN")
        .code("REF123")
        .build();

    when(customerBookingService.handleSePayWebhook(eq("ApiKey secret-key"), any(SePayWebhookDTO.class)))
        .thenReturn(Map.of("success", true));

    // Act & Assert
    mockMvc.perform(post("/api/v1/customer/payments/vietqr/webhook")
            .header("Authorization", "ApiKey secret-key")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(webhookDTO)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true));
  }

  @Test
  void checkout_unauthorized_shouldReturn401() throws Exception {
    // Arrange
    CheckoutRequestDTO requestDTO = CheckoutRequestDTO.builder()
        .eventId(UUID.randomUUID())
        .seatIds(List.of(UUID.randomUUID()))
        .paymentMethod(PaymentMethod.VIETQR)
        .build();

    // Act & Assert
    mockMvc.perform(post("/api/v1/customer/checkout")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(requestDTO)))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void checkout_success_shouldReturnSession() throws Exception {
    // Arrange
    UUID eventId = UUID.randomUUID();
    UUID seatId = UUID.randomUUID();
    CheckoutRequestDTO requestDTO = CheckoutRequestDTO.builder()
        .eventId(eventId)
        .seatIds(List.of(seatId))
        .paymentMethod(PaymentMethod.VIETQR)
        .build();

    CheckoutSessionDTO sessionDTO = CheckoutSessionDTO.builder()
        .paymentSessionId(UUID.randomUUID())
        .customerId(customerId)
        .eventId(eventId)
        .totalAmount(new BigDecimal("500000"))
        .build();

    when(customerBookingService.checkout(any(CheckoutRequestDTO.class), eq(customerId)))
        .thenReturn(sessionDTO);

    // Act & Assert
    mockMvc.perform(post("/api/v1/customer/checkout")
            .with(user(customerDetails))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(requestDTO)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.customerId").value(customerId.toString()))
        .andExpect(jsonPath("$.data.eventId").value(eventId.toString()))
        .andExpect(jsonPath("$.data.totalAmount").value(500000));
  }
}
