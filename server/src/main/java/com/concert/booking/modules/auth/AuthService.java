package com.concert.booking.modules.auth;

import com.concert.booking.modules.auth.dto.*;
import java.time.Instant;
import java.util.UUID;

public interface AuthService {
  // Chỉ dành cho Admin & Staff đăng nhập
  TokenDTO signIn(SignInDTO dto);

  TokenDTO refresh(RefreshTokenDTO dto);

  void signOut(UUID userId, String accessToken, Instant tokenExpiration);

  void changePassword(
      UUID userId, String accessToken, Instant tokenExpiration, ChangePasswordDTO dto);

  //   void forgotPassword(ForgotPasswordDTO dto);

  //   void resetPassword(ResetPasswordDTO dto);
}
