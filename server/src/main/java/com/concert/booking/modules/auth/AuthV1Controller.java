package com.concert.booking.modules.auth;

import com.concert.booking.common.dto.DataApiResponse;
import com.concert.booking.common.exception.AppException;
import com.concert.booking.common.swagger.BadRequestApiResponse;
import com.concert.booking.common.swagger.UnauthorizedApiResponse;
import com.concert.booking.modules.auth.dto.*;
import com.concert.booking.modules.auth.security.AuthCookieService;
import com.concert.booking.modules.auth.security.AuthUtils;
import com.concert.booking.modules.auth.security.JwtService;
import com.concert.booking.modules.user.User;
import com.concert.booking.modules.user.UserInfo;
import com.concert.booking.modules.user.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.io.IOException;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Authentication", description = "Các API phục vụ xác thực hệ thống")
public class AuthV1Controller {

  AuthService authService;
  JwtService jwtService;
  AuthCookieService authCookieService;
  UserRepository userRepository;

  @Operation(
      summary = "Đăng nhập",
      description = "Sử dụng username và password để lấy phiên đăng nhập.")
  @BadRequestApiResponse
  @UnauthorizedApiResponse
  @PostMapping("/sign-in")
  public DataApiResponse<AuthSessionDTO> signIn(
      HttpServletResponse response, @RequestBody @Valid SignInDTO dto) {
    TokenDTO tokenDTO = authService.signIn(dto);
    authCookieService.addAuthCookies(response, tokenDTO);
    return DataApiResponse.success(toSession(tokenDTO.getRole(), null), "Đăng nhập thành công");
  }

  @Operation(
      summary = "Làm mới Token",
      description = "Sử dụng Refresh Token trong cookie hoặc body để lấy phiên mới.")
  @BadRequestApiResponse
  @UnauthorizedApiResponse
  @PostMapping("/refresh")
  public DataApiResponse<AuthSessionDTO> refresh(
      HttpServletRequest request,
      HttpServletResponse response,
      @RequestBody(required = false) @Valid RefreshTokenDTO dto) {
    String refreshToken =
        dto != null && dto.getRefreshToken() != null
            ? dto.getRefreshToken()
            : authCookieService.getRefreshToken(request);

    if (refreshToken == null || refreshToken.isBlank()) {
      throw new AppException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
    }

    RefreshTokenDTO refreshTokenDTO = new RefreshTokenDTO();
    refreshTokenDTO.setRefreshToken(refreshToken);
    TokenDTO tokenDTO = authService.refresh(refreshTokenDTO);
    authCookieService.addAuthCookies(response, tokenDTO);
    return DataApiResponse.success(toSession(tokenDTO.getRole(), null), "Làm mới token thành công");
  }

  @Operation(
      summary = "Thông tin phiên đăng nhập",
      description = "Lấy user hiện tại từ cookie JWT.")
  @GetMapping("/me")
  public DataApiResponse<AuthSessionDTO> me() {
    User user = getCurrentUser();
    return DataApiResponse.success(
        toSession(user.getRole().name(), toUserInfo(user)), "Lấy phiên thành công");
  }

  @Operation(summary = "Đăng xuất", description = "Hủy bỏ phiên đăng nhập hiện tại.")
  @PostMapping("/sign-out")
  public DataApiResponse<Void> signOut(HttpServletRequest request, HttpServletResponse response) {
    String accessToken = extractTokenFromRequest(request);
    Instant tokenExpiration = getTokenExpiration(accessToken);
    authService.signOut(null, accessToken, tokenExpiration);
    authCookieService.clearAuthCookies(response);
    return DataApiResponse.success(null, "Đăng xuất thành công");
  }

  @Operation(summary = "Đổi mật khẩu", description = "Đổi mật khẩu cho tài khoản đang đăng nhập.")
  @BadRequestApiResponse
  @PostMapping("/change-password")
  public DataApiResponse<Void> changePassword(
      HttpServletRequest request,
      HttpServletResponse response,
      @RequestBody @Valid ChangePasswordDTO dto) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    String accessToken = extractTokenFromRequest(request);
    Instant tokenExpiration = getTokenExpiration(accessToken);
    authService.changePassword(currentUserId, accessToken, tokenExpiration, dto);
    authCookieService.clearAuthCookies(response);
    return DataApiResponse.success(null, "Đổi mật khẩu thành công");
  }

  @Operation(summary = "Quên mật khẩu", description = "Gửi yêu cầu khôi phục mật khẩu qua email.")
  @PostMapping("/forgot-password")
  public DataApiResponse<Void> forgotPassword() {
    return DataApiResponse.success(null, "Chức năng chưa được hỗ trợ trong Phase 1");
  }

  @Operation(
      summary = "1. Chuyển hướng đến trang Đăng nhập Google",
      description = "Nút Login with Google trên Frontend sẽ chuyển hướng vào API này")
  @GetMapping("/google")
  public void loginWithGoogle(HttpServletResponse response) throws IOException {
    response.sendRedirect("/oauth2/authorization/google");
  }

  @Operation(
      summary = "2. Hoàn tất đăng nhập OAuth2 (Bổ sung SĐT)",
      description = "Frontend gọi API này khi user chưa có SĐT và vừa nhập SĐT vào form")
  @PostMapping("/customer/complete-phone")
  public DataApiResponse<AuthSessionDTO> completeCustomerPhone(
      HttpServletResponse response, @Valid @RequestBody OAuth2CallbackDTO dto) {
    OAuth2LoginDTO responseDto = authService.completeOAuth2CustomerPhone(dto);
    authCookieService.addAuthCookies(response, toTokenDTO(responseDto));
    return DataApiResponse.success(
        toSession(responseDto.getUserInfo().getRole(), responseDto.getUserInfo()),
        "Đăng nhập thành công");
  }

  public DataApiResponse<Void> resetPassword() {
    return DataApiResponse.success(null, "Chức năng chưa được hỗ trợ trong Phase 1");
  }

  private User getCurrentUser() {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    return userRepository
        .findById(currentUserId)
        .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "Bạn chưa được xác thực"));
  }

  private AuthSessionDTO toSession(String role, UserInfo userInfo) {
    return AuthSessionDTO.builder().role(role).userInfo(userInfo).build();
  }

  private UserInfo toUserInfo(User user) {
    return UserInfo.builder()
        .email(user.getEmail())
        .phone(user.getPhone())
        .fullName(user.getFullName())
        .googleId(user.getGoogleId())
        .role(user.getRole().name())
        .status(user.getStatus().name())
        .build();
  }

  private TokenDTO toTokenDTO(OAuth2LoginDTO dto) {
    return TokenDTO.builder()
        .accessToken(dto.getAccessToken())
        .refreshToken(dto.getRefreshToken())
        .accessTokenExpiration(dto.getAccessTokenExpiration())
        .refreshTokenExpiration(dto.getRefreshTokenExpiration())
        .role(dto.getUserInfo().getRole())
        .build();
  }

  private String extractTokenFromRequest(HttpServletRequest request) {
    String bearerToken = request.getHeader("Authorization");
    if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
      return bearerToken.substring(7);
    }
    return authCookieService.getAccessToken(request);
  }

  private Instant getTokenExpiration(String token) {
    if (token == null) {
      return null;
    }
    try {
      return jwtService.getTokenExpiration(token);
    } catch (Exception e) {
      return null;
    }
  }
}
