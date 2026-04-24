package com.concert.booking.modules.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import com.concert.booking.common.dto.DataApiResponse;
import com.concert.booking.common.swagger.BadRequestApiResponse;
import com.concert.booking.common.swagger.UnauthorizedApiResponse;
import com.concert.booking.modules.auth.dto.*;
import com.concert.booking.modules.auth.security.AuthUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Authentication", description = "Các API phục vụ xác thực hệ thống (Dành cho Admin/Staff)")
public class AuthV1Controller {

  AuthService authService;

  @Operation(summary = "Đăng nhập", description = "Sử dụng username và password để lấy JWT Token.")
  @BadRequestApiResponse
  @UnauthorizedApiResponse
  @PostMapping("/sign-in")
  public DataApiResponse<TokenDTO> signIn(@RequestBody @Valid SignInDTO dto) {
    return DataApiResponse.success(
        authService.signIn(dto), 
        "Đăng nhập thành công"
    );
  }

  @Operation(summary = "Làm mới Token", description = "Sử dụng Refresh Token để lấy Access Token mới.")
  @BadRequestApiResponse
  @UnauthorizedApiResponse
  @PostMapping("/refresh")
  public DataApiResponse<TokenDTO> refresh(@RequestBody @Valid RefreshTokenDTO dto) {
    return DataApiResponse.success(
        authService.refresh(dto), 
        "Làm mới token thành công"
    );
  }

  @Operation(summary = "Đăng xuất", description = "Hủy bỏ phiên đăng nhập hiện tại.")
  @PostMapping("/sign-out")
  public DataApiResponse<Void> signOut() {
    UUID currentUserId = AuthUtils.getCurrentUserId(); 
    authService.signOut(currentUserId);
    return DataApiResponse.success(null, "Đăng xuất thành công");
  }

  @Operation(summary = "Đổi mật khẩu", description = "Đổi mật khẩu cho tài khoản đang đăng nhập.")
  @BadRequestApiResponse
  @PostMapping("/change-password")
  public DataApiResponse<Void> changePassword(@RequestBody @Valid ChangePasswordDTO dto) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    authService.changePassword(currentUserId, dto);
    return DataApiResponse.success(null, "Đổi mật khẩu thành công");
  }

  @Operation(summary = "Quên mật khẩu", description = "Gửi yêu cầu khôi phục mật khẩu qua email.")
  @PostMapping("/forgot-password")
//   public DataApiResponse<Void> forgotPassword(@RequestBody @Valid ForgotPasswordDTO dto) {
//     authService.forgotPassword(dto);
//     return DataApiResponse.success(null, "Vui lòng kiểm tra email để đặt lại mật khẩu");
//   }
  public DataApiResponse<Void> forgotPassword() {
    return DataApiResponse.success(null, "Chức năng chưa được hỗ trợ trong Phase 1");
  }

  @Operation(summary = "Đặt lại mật khẩu", description = "Sử dụng mã token trong email để đặt lại mật khẩu mới.")
  @PostMapping("/reset-password")
//   public DataApiResponse<Void> resetPassword(@RequestBody @Valid ResetPasswordDTO dto) {
//     authService.resetPassword(dto);
//     return DataApiResponse.success(null, "Đặt lại mật khẩu thành công");
//   }
  public DataApiResponse<Void> resetPassword() {
    return DataApiResponse.success(null, "Chức năng chưa được hỗ trợ trong Phase 1");
  }
}