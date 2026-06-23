package com.concert.booking.modules.admin;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.concert.booking.BaseIntegrationTest;
import com.concert.booking.modules.admin.dto.*;
import com.concert.booking.modules.auth.security.CustomUserDetails;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.dto.TicketClassCreateDTO;
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
import org.springframework.http.MediaType;

class AdminCatalogIntegrationTest extends BaseIntegrationTest {

  @Autowired ObjectMapper objectMapper;

  @MockBean AdminCatalogService adminCatalogService;
  @MockBean AdminDashboardStatsService adminDashboardStatsService;

  private CustomUserDetails adminDetails;
  private CustomUserDetails staffDetails;
  private CustomUserDetails customerDetails;

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

    User customer = User.builder()
        .id(UUID.randomUUID())
        .username("customer1")
        .role(UserRole.CUSTOMER)
        .status(UserStatus.ACTIVE)
        .build();
    customerDetails = new CustomUserDetails(customer);
  }

  @Test
  void createTicketClass_asAdmin_shouldSuccess() throws Exception {
    UUID eventId = UUID.randomUUID();
    TicketClassCreateDTO dto = TicketClassCreateDTO.builder()
        .name("VIP")
        .price(new BigDecimal("1000000"))
        .colorCode("#FF0000")
        .build();

    TicketClass ticketClass = TicketClass.builder()
        .id(UUID.randomUUID())
        .name("VIP")
        .price(new BigDecimal("1000000"))
        .colorCode("#FF0000")
        .build();

    when(adminCatalogService.createTicketClass(eq(eventId), any(TicketClassCreateDTO.class), any(UUID.class)))
        .thenReturn(ticketClass);

    mockMvc.perform(post("/api/v1/admin/events/" + eventId + "/ticket-classes")
            .with(user(adminDetails))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.name").value("VIP"));
  }

  @Test
  void createTicketClass_asStaff_shouldReturnForbidden() throws Exception {
    UUID eventId = UUID.randomUUID();
    TicketClassCreateDTO dto = TicketClassCreateDTO.builder()
        .name("VIP")
        .price(new BigDecimal("1000000"))
        .colorCode("#FF0000")
        .build();

    mockMvc.perform(post("/api/v1/admin/events/" + eventId + "/ticket-classes")
            .with(user(staffDetails))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isForbidden());
  }

  @Test
  void generateSeats_asAdmin_shouldSuccess() throws Exception {
    UUID eventId = UUID.randomUUID();
    SeatGenerateDTO dto = SeatGenerateDTO.builder()
        .ticketClassId(UUID.randomUUID())
        .totalRows(2)
        .totalColumns(10)
        .rowPrefix("A")
        .build();

    SeatGenerateResponseDTO response = SeatGenerateResponseDTO.builder()
        .createdCount(20)
        .build();

    when(adminCatalogService.generateSeats(eq(eventId), any(SeatGenerateDTO.class), any(UUID.class)))
        .thenReturn(response);

    mockMvc.perform(post("/api/v1/admin/events/" + eventId + "/seats/generate")
            .with(user(adminDetails))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.createdCount").value(20));
  }

  @Test
  void getDashboardStats_asAdmin_shouldSuccess() throws Exception {
    AdminDashboardStatsDTO stats = AdminDashboardStatsDTO.builder()
        .totalRevenue(new BigDecimal("50000000"))
        .ticketsSold(320L)
        .build();

    when(adminDashboardStatsService.getStats(anyInt())).thenReturn(stats);

    mockMvc.perform(get("/api/v1/admin/dashboard/stats")
            .with(user(adminDetails))
            .param("timeRange", "30"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.totalRevenue").value(50000000));
  }

  @Test
  void getDashboardStats_asCustomer_shouldReturnForbidden() throws Exception {
    mockMvc.perform(get("/api/v1/admin/dashboard/stats")
            .with(user(customerDetails)))
        .andExpect(status().isForbidden());
  }
}
