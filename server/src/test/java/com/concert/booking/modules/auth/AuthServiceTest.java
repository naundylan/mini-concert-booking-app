package com.concert.booking.modules.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.concert.booking.common.constants.JwtProperties;
import com.concert.booking.common.exception.AppException;
import com.concert.booking.core.auth.TokenBlacklistService;
import com.concert.booking.core.ratelimit.RateLimiterService;
import com.concert.booking.modules.auth.dto.*;
import com.concert.booking.modules.auth.security.JwtService;
import com.concert.booking.modules.user.*;
import com.concert.booking.modules.user.enums.AuthProvider;
import com.concert.booking.modules.user.enums.UserRole;
import com.concert.booking.modules.user.enums.UserStatus;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

  @Mock JwtService jwtService;
  @Mock JwtProperties jwtProperties;
  @Mock UserRepository userRepository;
  @Mock PasswordEncoder passwordEncoder;
  @Mock RateLimiterService rateLimiterService;
  @Mock TokenBlacklistService tokenBlacklistService;

  @InjectMocks AuthServiceImpl authService;

  private UUID userId;
  private User adminUser;
  private User customerUser;
  private SignInDTO signInDTO;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    adminUser =
        User.builder()
            .id(userId)
            .username("admin")
            .passwordHash("hashed_password")
            .email("admin@concert.com")
            .role(UserRole.ADMIN)
            .status(UserStatus.ACTIVE)
            .authProvider(AuthProvider.LOCAL)
            .build();

    customerUser =
        User.builder()
            .id(UUID.randomUUID())
            .username("customer")
            .passwordHash("hashed_password")
            .email("cust@concert.com")
            .role(UserRole.CUSTOMER)
            .status(UserStatus.ACTIVE)
            .authProvider(AuthProvider.LOCAL)
            .build();

    signInDTO = new SignInDTO();
    signInDTO.setUsername("admin");
    signInDTO.setPassword("admin_pass");
  }

  @Test
  void signIn_success() {
    // Arrange
    when(rateLimiterService.isAllowed("admin", "signin")).thenReturn(true);
    when(userRepository.findByUsername("admin")).thenReturn(Optional.of(adminUser));
    when(passwordEncoder.matches("admin_pass", "hashed_password")).thenReturn(true);
    when(jwtService.generateAccessToken(userId)).thenReturn("mock_access_token");
    when(jwtService.generateRefreshToken(userId)).thenReturn("mock_refresh_token");
    when(jwtProperties.getAccessTokenExpiration()).thenReturn(900000L); // 15 mins in ms
    when(jwtProperties.getRefreshTokenExpiration()).thenReturn(604800000L); // 7 days in ms

    // Act
    TokenDTO result = authService.signIn(signInDTO);

    // Assert
    assertNotNull(result);
    assertEquals("mock_access_token", result.getAccessToken());
    assertEquals("mock_refresh_token", result.getRefreshToken());
    assertEquals("ADMIN", result.getRole());
    verify(rateLimiterService, times(1)).reset("admin", "signin");
  }

  @Test
  void signIn_rateLimitExceeded_shouldThrowException() {
    // Arrange
    when(rateLimiterService.isAllowed("admin", "signin")).thenReturn(false);

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> authService.signIn(signInDTO));
    assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatusCode());
    verifyNoInteractions(userRepository);
  }

  @Test
  void signIn_wrongPassword_shouldThrowException() {
    // Arrange
    when(rateLimiterService.isAllowed("admin", "signin")).thenReturn(true);
    when(userRepository.findByUsername("admin")).thenReturn(Optional.of(adminUser));
    when(passwordEncoder.matches("admin_pass", "hashed_password")).thenReturn(false);

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> authService.signIn(signInDTO));
    assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
  }

  @Test
  void signIn_inactiveUser_shouldThrowException() {
    // Arrange
    adminUser.setStatus(UserStatus.LOCKED);
    when(rateLimiterService.isAllowed("admin", "signin")).thenReturn(true);
    when(userRepository.findByUsername("admin")).thenReturn(Optional.of(adminUser));
    when(passwordEncoder.matches("admin_pass", "hashed_password")).thenReturn(true);

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> authService.signIn(signInDTO));
    assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    assertEquals("Tài khoản không hoạt động", exception.getMessage());
  }

  @Test
  void signIn_customerAccessForbidden_shouldThrowException() {
    // Arrange
    when(rateLimiterService.isAllowed("customer", "signin")).thenReturn(true);
    when(userRepository.findByUsername("customer")).thenReturn(Optional.of(customerUser));
    when(passwordEncoder.matches("admin_pass", "hashed_password")).thenReturn(true);
    
    signInDTO = new SignInDTO();
    signInDTO.setUsername("customer");
    signInDTO.setPassword("admin_pass");

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> authService.signIn(signInDTO));
    assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    assertEquals("Chỉ Admin và Staff mới được đăng nhập", exception.getMessage());
  }

  @Test
  void refresh_success() {
    // Arrange
    RefreshTokenDTO refreshDTO = new RefreshTokenDTO();
    refreshDTO.setRefreshToken("mock_refresh_token");
    
    when(jwtService.extractUserId("mock_refresh_token")).thenReturn(userId);
    when(userRepository.findById(userId)).thenReturn(Optional.of(adminUser));
    when(jwtService.generateAccessToken(userId)).thenReturn("new_access_token");
    when(jwtService.generateRefreshToken(userId)).thenReturn("new_refresh_token");

    // Act
    TokenDTO result = authService.refresh(refreshDTO);

    // Assert
    assertNotNull(result);
    assertEquals("new_access_token", result.getAccessToken());
    assertEquals("new_refresh_token", result.getRefreshToken());
  }

  @Test
  void refresh_invalidToken_shouldThrowException() {
    // Arrange
    RefreshTokenDTO refreshDTO = new RefreshTokenDTO();
    refreshDTO.setRefreshToken("invalid_refresh_token");
    
    when(jwtService.extractUserId("invalid_refresh_token")).thenThrow(new RuntimeException("Invalid token"));

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> authService.refresh(refreshDTO));
    assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
  }

  @Test
  void signOut_shouldBlacklistToken() {
    // Act
    Instant expiration = Instant.now().plusSeconds(3600);
    authService.signOut(userId, "access_token", expiration);

    // Assert
    verify(tokenBlacklistService, times(1)).blacklistToken("access_token", expiration);
  }

  @Test
  void changePassword_success() {
    // Arrange
    ChangePasswordDTO changeDTO = new ChangePasswordDTO();
    changeDTO.setCurrentPassword("old_pass");
    changeDTO.setNewPassword("new_pass");
    
    when(rateLimiterService.isAllowed(userId.toString(), "changePassword")).thenReturn(true);
    when(userRepository.findById(userId)).thenReturn(Optional.of(adminUser));
    when(passwordEncoder.matches("old_pass", "hashed_password")).thenReturn(true);
    when(passwordEncoder.encode("new_pass")).thenReturn("new_hashed_password");

    // Act
    authService.changePassword(userId, "access_token", Instant.now().plusSeconds(3600), changeDTO);

    // Assert
    assertEquals("new_hashed_password", adminUser.getPasswordHash());
    verify(userRepository, times(1)).save(adminUser);
    verify(tokenBlacklistService, times(1)).blacklistToken(eq("access_token"), any());
    verify(rateLimiterService, times(1)).reset(userId.toString(), "changePassword");
  }

  @Test
  void processOAuth2Customer_existingUserWithPhone_shouldReturnTokens() {
    // Arrange
    OAuth2User oAuth2User = mock(OAuth2User.class);
    when(oAuth2User.getAttribute("email")).thenReturn("customer@gmail.com");
    when(oAuth2User.getAttribute("sub")).thenReturn("google_12345");
    when(oAuth2User.getAttribute("name")).thenReturn("Google User");

    User existingCustomer = User.builder()
        .id(UUID.randomUUID())
        .email("customer@gmail.com")
        .googleId("google_12345")
        .fullName("Google User")
        .phone("0987654321")
        .role(UserRole.CUSTOMER)
        .status(UserStatus.ACTIVE)
        .build();

    when(userRepository.findByGoogleId("google_12345")).thenReturn(Optional.of(existingCustomer));
    when(userRepository.save(any(User.class))).thenReturn(existingCustomer);
    when(jwtService.generateAccessToken(existingCustomer.getId())).thenReturn("google_access_token");
    when(jwtService.generateRefreshToken(existingCustomer.getId())).thenReturn("google_refresh_token");

    // Act
    OAuth2LoginDTO result = authService.processOAuth2Customer(oAuth2User);

    // Assert
    assertNotNull(result);
    assertEquals("google_access_token", result.getAccessToken());
    assertEquals("google_refresh_token", result.getRefreshToken());
    assertNotNull(result.getUserInfo());
    assertEquals("0987654321", result.getUserInfo().getPhone());
  }

  @Test
  void processOAuth2Customer_existingUserNoPhone_shouldReturnUserInfoOnly() {
    // Arrange
    OAuth2User oAuth2User = mock(OAuth2User.class);
    when(oAuth2User.getAttribute("email")).thenReturn("customer@gmail.com");
    when(oAuth2User.getAttribute("sub")).thenReturn("google_12345");
    when(oAuth2User.getAttribute("name")).thenReturn("Google User");

    User existingCustomer = User.builder()
        .id(UUID.randomUUID())
        .email("customer@gmail.com")
        .googleId("google_12345")
        .fullName("Google User")
        .phone(null) // no phone
        .role(UserRole.CUSTOMER)
        .status(UserStatus.ACTIVE)
        .build();

    when(userRepository.findByGoogleId("google_12345")).thenReturn(Optional.of(existingCustomer));
    when(userRepository.save(any(User.class))).thenReturn(existingCustomer);

    // Act
    OAuth2LoginDTO result = authService.processOAuth2Customer(oAuth2User);

    // Assert
    assertNotNull(result);
    assertNull(result.getAccessToken());
    assertEquals("customer@gmail.com", result.getUserInfo().getEmail());
    assertNull(result.getUserInfo().getPhone());
  }

  @Test
  void completeOAuth2CustomerPhone_mergePOSUser_success() {
    // Arrange
    OAuth2CallbackDTO callbackDTO = OAuth2CallbackDTO.builder()
        .email("pos_user@gmail.com")
        .phone("0912345678")
        .googleId("google_9999")
        .fullName("POS Google User")
        .build();

    User posUser = User.builder()
        .id(UUID.randomUUID())
        .phone("0912345678") // Has phone in POS
        .email(null) // No email in POS yet
        .role(UserRole.CUSTOMER)
        .status(UserStatus.ACTIVE)
        .build();

    when(userRepository.findByEmail("pos_user@gmail.com")).thenReturn(Optional.empty());
    when(userRepository.findByPhone("0912345678")).thenReturn(Optional.of(posUser));
    when(userRepository.save(any(User.class))).thenReturn(posUser);
    when(jwtService.generateAccessToken(posUser.getId())).thenReturn("merged_access_token");
    when(jwtService.generateRefreshToken(posUser.getId())).thenReturn("merged_refresh_token");

    // Act
    OAuth2LoginDTO result = authService.completeOAuth2CustomerPhone(callbackDTO);

    // Assert
    assertNotNull(result);
    assertEquals("merged_access_token", result.getAccessToken());
    assertEquals("pos_user@gmail.com", posUser.getEmail());
    assertEquals("google_9999", posUser.getGoogleId());
    assertEquals(AuthProvider.GOOGLE, posUser.getAuthProvider());
  }
}
