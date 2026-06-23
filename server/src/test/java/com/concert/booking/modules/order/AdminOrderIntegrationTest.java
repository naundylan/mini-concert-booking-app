package com.concert.booking.modules.order;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.concert.booking.BaseIntegrationTest;
import com.concert.booking.modules.auth.security.CustomUserDetails;
import com.concert.booking.modules.order.dto.AdminOrderDetailResponseDTO;
import com.concert.booking.modules.order.dto.AdminOrderResponseDTO;
import com.concert.booking.modules.order.enums.OrderStatus;
import com.concert.booking.modules.user.User;
import com.concert.booking.modules.user.enums.UserRole;
import com.concert.booking.modules.user.enums.UserStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;

class AdminOrderIntegrationTest extends BaseIntegrationTest {

  @Autowired ObjectMapper objectMapper;

  @MockBean OrderService orderService;

  private CustomUserDetails adminDetails;
  private CustomUserDetails staffDetails;

  @BeforeEach
  void setUp() {
    User admin = User.builder()
        .id(UUID.randomUUID())
        .username("admin1")
        .role(UserRole.ADMIN)
        .status(UserStatus.ACTIVE)
        .build();
    adminDetails = new CustomUserDetails(admin);

    User staff = User.builder()
        .id(UUID.randomUUID())
        .username("staff1")
        .role(UserRole.STAFF)
        .status(UserStatus.ACTIVE)
        .build();
    staffDetails = new CustomUserDetails(staff);
  }

  @Test
  void getAdminOrders_asAdmin_shouldSuccess() throws Exception {
    AdminOrderResponseDTO dto = AdminOrderResponseDTO.builder()
        .id(UUID.randomUUID())
        .orderCode("POS12345")
        .totalAmount(new BigDecimal("500000"))
        .status(OrderStatus.PAID)
        .build();

    Page<AdminOrderResponseDTO> page = new PageImpl<>(Collections.singletonList(dto));

    when(orderService.getAdminOrders(any(), any(), any(), any(Pageable.class))).thenReturn(page);

    mockMvc.perform(get("/api/v1/admin/orders")
            .with(user(adminDetails))
            .param("page", "0")
            .param("size", "10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.content[0].orderCode").value("POS12345"));
  }

  @Test
  void getAdminOrders_asStaff_shouldReturnForbidden() throws Exception {
    mockMvc.perform(get("/api/v1/admin/orders")
            .with(user(staffDetails)))
        .andExpect(status().isForbidden());
  }

  @Test
  void getAdminOrderDetail_asAdmin_shouldSuccess() throws Exception {
    UUID orderId = UUID.randomUUID();
    AdminOrderDetailResponseDTO detail = AdminOrderDetailResponseDTO.builder()
        .id(orderId)
        .orderCode("POS12345")
        .totalAmount(new BigDecimal("500000"))
        .status(OrderStatus.PAID)
        .build();

    when(orderService.getAdminOrderDetail(orderId)).thenReturn(detail);

    mockMvc.perform(get("/api/v1/admin/orders/" + orderId)
            .with(user(adminDetails)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.orderCode").value("POS12345"));
  }
}
