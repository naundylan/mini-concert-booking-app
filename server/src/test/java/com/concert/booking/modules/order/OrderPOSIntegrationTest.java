package com.concert.booking.modules.order;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.concert.booking.BaseIntegrationTest;
import com.concert.booking.modules.auth.security.CustomUserDetails;
import com.concert.booking.modules.order.dto.*;
import com.concert.booking.modules.order.enums.OrderStatus;
import com.concert.booking.modules.order.enums.PaymentMethod;
import com.concert.booking.modules.user.User;
import com.concert.booking.modules.user.enums.UserRole;
import com.concert.booking.modules.user.enums.UserStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;

class OrderPOSIntegrationTest extends BaseIntegrationTest {

  @Autowired ObjectMapper objectMapper;

  @MockBean OrderService orderService;

  private CustomUserDetails staffDetails;
  private CustomUserDetails customerDetails;

  @BeforeEach
  void setUp() {
    User staff = User.builder()
        .id(UUID.randomUUID())
        .username("staff1")
        .role(UserRole.STAFF)
        .status(UserStatus.ACTIVE)
        .build();
    staffDetails = new CustomUserDetails(staff);

    User customer = User.builder()
        .id(UUID.randomUUID())
        .username("customer1")
        .role(UserRole.CUSTOMER)
        .status(UserStatus.ACTIVE)
        .build();
    customerDetails = new CustomUserDetails(customer);
  }

  @Test
  void lookupCustomer_asStaff_shouldSuccess() throws Exception {
    CustomerLookupDTO dto = CustomerLookupDTO.builder()
        .customerId(UUID.randomUUID())
        .found(true)
        .fullName("Customer Test")
        .phone("0987654321")
        .build();

    when(orderService.lookupCustomerByPhone("0987654321")).thenReturn(dto);

    mockMvc.perform(get("/api/v1/orders/pos/customers/lookup")
            .with(user(staffDetails))
            .param("phone", "0987654321"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.phone").value("0987654321"));
  }

  @Test
  void lookupCustomer_asCustomer_shouldReturnForbidden() throws Exception {
    mockMvc.perform(get("/api/v1/orders/pos/customers/lookup")
            .with(user(customerDetails))
            .param("phone", "0987654321"))
        .andExpect(status().isForbidden());
  }

  @Test
  void createOrder_asStaff_shouldSuccess() throws Exception {
    OrderCreateDTO dto = OrderCreateDTO.builder()
        .eventId(UUID.randomUUID())
        .seatIds(List.of(UUID.randomUUID()))
        .phone("0987654321")
        .fullName("Customer POS")
        .email("pos@example.com")
        .payment(PaymentCreateDTO.builder()
            .paymentMethod(PaymentMethod.CASH)
            .amountReceived(new BigDecimal("500000"))
            .build())
        .build();

    OrderResponseDTO response = OrderResponseDTO.builder()
        .orderId(UUID.randomUUID())
        .orderCode("POS12345")
        .totalAmount(new BigDecimal("500000"))
        .status(OrderStatus.PAID)
        .build();

    when(orderService.createOrder(any(OrderCreateDTO.class), any(UUID.class))).thenReturn(response);

    mockMvc.perform(post("/api/v1/orders/pos")
            .with(user(staffDetails))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.orderCode").value("POS12345"));
  }

  @Test
  void createOrder_asCustomer_shouldReturnForbidden() throws Exception {
    OrderCreateDTO dto = OrderCreateDTO.builder()
        .eventId(UUID.randomUUID())
        .seatIds(List.of(UUID.randomUUID()))
        .phone("0987654321")
        .fullName("Customer POS")
        .payment(PaymentCreateDTO.builder()
            .paymentMethod(PaymentMethod.CASH)
            .amountReceived(new BigDecimal("500000"))
            .build())
        .build();

    mockMvc.perform(post("/api/v1/orders/pos")
            .with(user(customerDetails))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isForbidden());
  }

  @Test
  void handlePaymentWebhook_public_shouldSuccess() throws Exception {
    PaymentWebhookDTO dto = PaymentWebhookDTO.builder()
        .orderCode("POS12345")
        .amount(new BigDecimal("500000"))
        .success(true)
        .transactionRef("TX123")
        .build();

    OrderResponseDTO response = OrderResponseDTO.builder()
        .orderId(UUID.randomUUID())
        .orderCode("POS12345")
        .totalAmount(new BigDecimal("500000"))
        .status(OrderStatus.PAID)
        .build();

    when(orderService.handlePaymentWebhook(any(PaymentWebhookDTO.class))).thenReturn(response);

    mockMvc.perform(post("/api/v1/orders/webhooks/payment")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.status").value("PAID"));
  }
}
