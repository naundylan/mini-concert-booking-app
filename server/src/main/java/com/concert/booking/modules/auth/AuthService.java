package com.concert.booking.modules.auth;

import com.concert.booking.modules.auth.dto.*;
import com.concert.booking.modules.user.User;

import java.time.Instant;
import java.util.UUID;

import org.springframework.security.oauth2.core.user.OAuth2User;

public interface AuthService {
  // Chỉ dành cho Admin & Staff đăng nhập
  TokenDTO signIn(SignInDTO dto);

  TokenDTO refresh(RefreshTokenDTO dto);

  void signOut(UUID userId, String accessToken, Instant tokenExpiration);

  void changePassword(
      UUID userId, String accessToken, Instant tokenExpiration, ChangePasswordDTO dto);

  //   void forgotPassword(ForgotPasswordDTO dto);

  //   void resetPassword(ResetPasswordDTO dto);
  
  // OAuth2 cho Customer
  OAuth2LoginDTO processOAuth2Customer(OAuth2User oAuth2User);
  
  OAuth2LoginDTO completeOAuth2CustomerPhone(OAuth2CallbackDTO callbackDTO);
}
