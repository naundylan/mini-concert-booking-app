package com.concert.booking.modules.user;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.concert.booking.BaseIntegrationTest;
import com.concert.booking.modules.auth.security.CustomUserDetails;
import com.concert.booking.modules.user.dto.*;
import com.concert.booking.modules.user.enums.UserRole;
import com.concert.booking.modules.user.enums.UserStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Collections;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;

class UserManagementIntegrationTest extends BaseIntegrationTest {

  @Autowired ObjectMapper objectMapper;

  @MockBean UserService userService;

  private CustomUserDetails adminDetails;
  private CustomUserDetails staffDetails;
  private CustomUserDetails customerDetails;
  private User mockUser;

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

    mockUser = User.builder()
        .id(UUID.randomUUID())
        .username("new_user")
        .fullName("New User")
        .email("new@example.com")
        .role(UserRole.STAFF)
        .status(UserStatus.ACTIVE)
        .build();
  }

  @Test
  void createStaff_asAdmin_shouldSuccess() throws Exception {
    CreateStaffDTO dto = CreateStaffDTO.builder()
        .username("new_staff")
        .password("password123")
        .fullName("New Staff")
        .email("staff@example.com")
        .build();

    when(userService.createStaff(any(CreateStaffDTO.class), any(UUID.class))).thenReturn(mockUser);

    mockMvc.perform(post("/api/v1/users/staff")
            .with(user(adminDetails))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.fullName").value("New User"));
  }

  @Test
  void createStaff_asStaff_shouldReturnForbidden() throws Exception {
    CreateStaffDTO dto = CreateStaffDTO.builder()
        .username("new_staff")
        .password("password123")
        .fullName("New Staff")
        .email("staff@example.com")
        .build();

    mockMvc.perform(post("/api/v1/users/staff")
            .with(user(staffDetails))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isForbidden());
  }

  @Test
  void createCustomer_asStaff_shouldSuccess() throws Exception {
    CreateCustomerDTO dto = CreateCustomerDTO.builder()
        .phone("0987654321")
        .fullName("Customer Walkin")
        .build();

    User customerUser = User.builder()
        .id(UUID.randomUUID())
        .username("cust_0987654321")
        .fullName("Customer Walkin")
        .role(UserRole.CUSTOMER)
        .status(UserStatus.ACTIVE)
        .build();

    when(userService.createCustomer(any(CreateCustomerDTO.class), any(UUID.class))).thenReturn(customerUser);

    mockMvc.perform(post("/api/v1/users/customer")
            .with(user(staffDetails))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.fullName").value("Customer Walkin"));
  }

  @Test
  void createCustomer_asCustomer_shouldReturnForbidden() throws Exception {
    CreateCustomerDTO dto = CreateCustomerDTO.builder()
        .phone("0987654321")
        .fullName("Customer Walkin")
        .build();

    mockMvc.perform(post("/api/v1/users/customer")
            .with(user(customerDetails))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isForbidden());
  }

  @Test
  void getProfile_authenticated_shouldSuccess() throws Exception {
    when(userService.getUserProfile(any(UUID.class))).thenReturn(mockUser);

    mockMvc.perform(get("/api/v1/users/profile")
            .with(user(customerDetails)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true));
  }

  @Test
  void getProfile_anonymous_shouldReturn401() throws Exception {
    mockMvc.perform(get("/api/v1/users/profile"))
        .andExpect(status().isUnauthorized());
  }
}
