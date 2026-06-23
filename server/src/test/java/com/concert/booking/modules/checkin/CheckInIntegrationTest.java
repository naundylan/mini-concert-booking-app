package com.concert.booking.modules.checkin;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.concert.booking.BaseIntegrationTest;
import com.concert.booking.modules.auth.security.CustomUserDetails;
import com.concert.booking.modules.user.User;
import com.concert.booking.modules.user.enums.UserRole;
import com.concert.booking.modules.user.enums.UserStatus;
import java.util.Collections;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;

class CheckInIntegrationTest extends BaseIntegrationTest {

  @MockBean CheckInService checkInService;

  private CustomUserDetails staffDetails;
  private CustomUserDetails customerDetails;

  @BeforeEach
  void setUp() {
    User staff =
        User.builder()
            .id(UUID.randomUUID())
            .username("staff1")
            .role(UserRole.STAFF)
            .status(UserStatus.ACTIVE)
            .build();
    staffDetails = new CustomUserDetails(staff);

    User customer =
        User.builder()
            .id(UUID.randomUUID())
            .username("cust1")
            .role(UserRole.CUSTOMER)
            .status(UserStatus.ACTIVE)
            .build();
    customerDetails = new CustomUserDetails(customer);
  }

  @Test
  void getCheckInEvents_anonymous_shouldReturn401() throws Exception {
    // Act & Assert
    mockMvc.perform(get("/api/v1/check-in/events"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void getCheckInEvents_asCustomer_shouldReturn403() throws Exception {
    // Act & Assert
    mockMvc.perform(get("/api/v1/check-in/events")
            .with(user(customerDetails)))
        .andExpect(status().isForbidden());
  }

  @Test
  void getCheckInEvents_asStaff_shouldSuccess() throws Exception {
    // Arrange
    when(checkInService.getCheckInEvents()).thenReturn(Collections.emptyList());

    // Act & Assert
    mockMvc.perform(get("/api/v1/check-in/events")
            .with(user(staffDetails)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data").isArray());
  }
}
