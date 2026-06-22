package com.concert.booking.modules.auth;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.concert.booking.BaseIntegrationTest;
import com.concert.booking.modules.auth.dto.*;
import com.concert.booking.modules.auth.security.CustomUserDetails;
import com.concert.booking.modules.user.User;
import com.concert.booking.modules.user.UserRepository;
import com.concert.booking.modules.user.enums.UserRole;
import com.concert.booking.modules.user.enums.UserStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;

class AuthIntegrationTest extends BaseIntegrationTest {

  @Autowired ObjectMapper objectMapper;

  @MockBean AuthService authService;
  @MockBean UserRepository userRepository;

  private UUID userId;
  private User adminUser;
  private CustomUserDetails userDetails;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    adminUser =
        User.builder()
            .id(userId)
            .username("admin")
            .fullName("Super Admin")
            .email("admin@concert.com")
            .role(UserRole.ADMIN)
            .status(UserStatus.ACTIVE)
            .phone("0987654321")
            .build();

    userDetails = new CustomUserDetails(adminUser);
  }

  @Test
  void signIn_success_shouldReturnCookiesAndTokens() throws Exception {
    // Arrange
    SignInDTO signInDTO = new SignInDTO();
    signInDTO.setUsername("admin");
    signInDTO.setPassword("admin_pass");

    TokenDTO mockToken = TokenDTO.builder()
        .accessToken("access_token_123")
        .refreshToken("refresh_token_123")
        .accessTokenExpiration(Duration.ofMinutes(15).toMillis())
        .refreshTokenExpiration(Duration.ofDays(7).toMillis())
        .role("ADMIN")
        .build();

    when(authService.signIn(any(SignInDTO.class))).thenReturn(mockToken);

    // Act & Assert
    mockMvc.perform(post("/api/v1/auth/sign-in")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(signInDTO)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.role").value("ADMIN"))
        .andExpect(cookie().exists("accessToken"))
        .andExpect(cookie().exists("refreshToken"))
        .andExpect(cookie().httpOnly("accessToken", true))
        .andExpect(cookie().httpOnly("refreshToken", true));
  }

  @Test
  void signIn_validationError_shouldReturnBadRequest() throws Exception {
    // Arrange
    SignInDTO signInDTO = new SignInDTO(); // empty username/password

    // Act & Assert
    mockMvc.perform(post("/api/v1/auth/sign-in")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(signInDTO)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.message").exists());
  }

  @Test
  void me_unauthorized_shouldReturn401() throws Exception {
    // Act & Assert
    mockMvc.perform(get("/api/v1/auth/me"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void me_success_shouldReturnUserInfo() throws Exception {
    // Arrange
    when(userRepository.findById(userId)).thenReturn(Optional.of(adminUser));

    // Act & Assert
    mockMvc.perform(get("/api/v1/auth/me")
            .with(user(userDetails))) // Mock authentication context directly
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.role").value("ADMIN"))
        .andExpect(jsonPath("$.data.userInfo.email").value("admin@concert.com"))
        .andExpect(jsonPath("$.data.userInfo.phone").value("0987654321"));
  }
}
