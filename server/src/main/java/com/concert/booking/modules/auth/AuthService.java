package com.concert.booking.modules.auth;

import com.concert.booking.modules.auth.dto.*;
import java.util.UUID;

public interface AuthService {
  // Chỉ dành cho Admin & Staff đăng nhập
  TokenDTO signIn(SignInDTO dto);

  TokenDTO refresh(RefreshTokenDTO dto);

  void signOut(UUID userId);

  void changePassword(UUID userId, ChangePasswordDTO dto);

  //   void forgotPassword(ForgotPasswordDTO dto);

  //   void resetPassword(ResetPasswordDTO dto);
}
