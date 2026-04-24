package com.concert.booking.modules.auth;

import com.concert.booking.common.constants.JwtProperties;
import com.concert.booking.common.exception.AppException;
import com.concert.booking.core.auth.TokenBlacklistService;
import com.concert.booking.core.file.FileService;
import com.concert.booking.core.mail.MailService;
import com.concert.booking.core.ratelimit.RateLimiterService;
// import com.concert.booking.modules.audit.AuditLogService;
import com.concert.booking.modules.audit.enums.*;
import com.concert.booking.modules.auth.dto.*;
import com.concert.booking.modules.auth.security.JwtService;
import com.concert.booking.modules.user.*;
import com.concert.booking.modules.user.enums.AuthProvider;
import com.concert.booking.modules.user.enums.UserRole;
import com.concert.booking.modules.user.enums.UserStatus;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthServiceImpl implements AuthService {
  JwtService jwtService;
  JwtProperties jwtProperties;
  UserRepository userRepository;
  PasswordEncoder passwordEncoder;
  MailService mailService;
  FileService fileService;
  ModelMapper modelMapper;
  RateLimiterService rateLimiterService;
  TokenBlacklistService tokenBlacklistService;

  //   AuditLogService auditLogService;

  @Override
  @Transactional
  public TokenDTO signIn(SignInDTO dto) {
    // Check rate limit before processing
    if (!rateLimiterService.isAllowed(dto.getUsername(), "signin")) {
      throw new AppException(
          HttpStatus.TOO_MANY_REQUESTS,
          "Vượt quá số lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.");
    }

    User user = findUserByUsername(dto.getUsername());

    if (!passwordEncoder.matches(dto.getPassword(), user.getPasswordHash())) {
      throw new AppException(HttpStatus.UNAUTHORIZED, "Sai thông tin đăng nhập");
    }

    validateUserCanAuthenticate(user);

    // Reset rate limit on successful signin
    rateLimiterService.reset(dto.getUsername(), "signin");

    String accessToken = jwtService.generateAccessToken(user.getId());
    String refreshToken = jwtService.generateRefreshToken(user.getId());

    return TokenDTO.builder()
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .accessTokenExpiration(jwtProperties.getAccessTokenExpiration())
        .refreshTokenExpiration(jwtProperties.getRefreshTokenExpiration())
        .build();
  }

  @Override
  @Transactional
  public TokenDTO refresh(RefreshTokenDTO dto) {
    try {
      UUID userId = jwtService.extractUserId(dto.getRefreshToken());
      User user =
          userRepository
              .findById(userId)
              .orElseThrow(
                  () -> new AppException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

      validateUserCanAuthenticate(user);

      String accessToken = jwtService.generateAccessToken(user.getId());
      String refreshToken = jwtService.generateRefreshToken(user.getId());

      return TokenDTO.builder()
          .accessToken(accessToken)
          .refreshToken(refreshToken)
          .accessTokenExpiration(jwtProperties.getAccessTokenExpiration())
          .refreshTokenExpiration(jwtProperties.getRefreshTokenExpiration())
          .build();
    } catch (Exception e) {
      throw new AppException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
    }
  }

  @Override
  @Transactional
  public void signOut(UUID userId, String accessToken, Instant tokenExpiration) {
    // Blacklist the current access token to force logout
    if (accessToken != null && tokenExpiration != null) {
      tokenBlacklistService.blacklistToken(accessToken, tokenExpiration);
    }
  }

  @Override
  @Transactional
  public void changePassword(
      UUID userId, String accessToken, Instant tokenExpiration, ChangePasswordDTO dto) {
    // Check rate limit before processing
    if (!rateLimiterService.isAllowed(userId.toString(), "changePassword")) {
      throw new AppException(
          HttpStatus.TOO_MANY_REQUESTS,
          "Vượt quá số lần đổi mật khẩu. Vui lòng thử lại sau 15 phút.");
    }

    User user =
        userRepository
            .findById(userId)
            .orElseThrow(
                () -> new AppException(HttpStatus.NOT_FOUND, UserMessage.NOT_FOUND.getMessage()));
    if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPasswordHash())) {
      throw new AppException(HttpStatus.UNAUTHORIZED, AuthMessage.INVALID_CREDENTIALS.getMessage());
    }

    user.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
    userRepository.save(user);

    // Blacklist the current access token to force logout after password change
    if (accessToken != null && tokenExpiration != null) {
      tokenBlacklistService.blacklistToken(accessToken, tokenExpiration);
    }

    // Reset rate limit on successful password change
    rateLimiterService.reset(userId.toString(), "changePassword");
  }

  //   @Override
  //   public void forgotPassword(ForgotPasswordDTO dto) {
  //     User user = userRepository.findByEmail(dto.getEmail()).orElse(null);
  //     if (user == null) {
  //       auditLogService.log(
  //           null,
  //           dto.getEmail(),
  //           AuditLogAction.FORGOT_PASSWORD,
  //           AuditLogEntity.AUTH,
  //           null,
  //           AuditLogStatus.FAILED,
  //           "Gửi yêu cầu quên mật khẩu cho email không tồn tại");
  //       return;
  //     }

  //     String token = AuthUtils.generateToken(64);
  //     String tokenHash = AuthUtils.hashToken(token);

  //     user.setResetPasswordTokenHash(tokenHash);
  //     user.setResetPasswordTokenExpiredAt(Instant.now().plusSeconds(15 * 60));

  //     userRepository.save(user);

  //     mailService.sendForgotPasswordMail(user.getEmail(), token);
  //     auditLogService.log(
  //         user.getId(),
  //         user.getUsername(),
  //         AuditLogAction.FORGOT_PASSWORD,
  //         AuditLogEntity.USER,
  //         user.getId().toString(),
  //         AuditLogStatus.SUCCESS,
  //         "Gửi email đặt lại mật khẩu thành công");
  //   }

  //   @Override
  //   @Transactional
  //   public void resetPassword(ResetPasswordDTO dto) {
  //     String tokenHash = AuthUtils.hashToken(dto.getToken());

  //     User user =
  //         userRepository
  //             .findByResetPasswordTokenHash(tokenHash)
  //             .orElseThrow(this::invalidResetPasswordTokenException);

  //     Instant now = Instant.now();
  //     Instant resetPasswordTokenExpiredAt = user.getResetPasswordTokenExpiredAt();
  //     if (resetPasswordTokenExpiredAt == null || !resetPasswordTokenExpiredAt.isAfter(now)) {
  //       user.setResetPasswordTokenHash(null);
  //       user.setResetPasswordTokenExpiredAt(null);
  //       userRepository.save(user);
  //       auditLogService.log(
  //           user.getId(),
  //           user.getUsername(),
  //           AuditLogAction.RESET_PASSWORD,
  //           AuditLogEntity.USER,
  //           user.getId().toString(),
  //           AuditLogStatus.FAILED,
  //           "Đặt lại mật khẩu thất bại do token hết hạn");
  //       throw new AppException(
  //           HttpStatus.UNAUTHORIZED, AuthMessage.EXPIRED_RESET_PASSWORD_TOKEN.getMessage());
  //     }

  //     user.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
  //     user.setPasswordChanged(true);

  //     user.setResetPasswordTokenHash(null);
  //     user.setResetPasswordTokenExpiredAt(null);

  //     user.setRefreshTokenHash(null);
  //     user.setRefreshTokenExpiredAt(null);

  //     userRepository.save(user);
  //     auditLogService.log(
  //         user.getId(),
  //         user.getUsername(),
  //         AuditLogAction.RESET_PASSWORD,
  //         AuditLogEntity.USER,
  //         user.getId().toString(),
  //         AuditLogStatus.SUCCESS,
  //         "Đặt lại mật khẩu thành công");
  //   }

  private User findUserByUsername(String username) {
    return userRepository
        .findByUsername(username)
        .orElseThrow(() -> invalidCredentialsException(username));
  }

  private void validateUserCanAuthenticate(User user) {
    if (user.getStatus() != UserStatus.ACTIVE) {
      throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản không hoạt động");
    }

    if (user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.STAFF) {
      throw new AppException(HttpStatus.FORBIDDEN, "Chỉ Admin và Staff mới được đăng nhập");
    }

    if (user.getAuthProvider() != AuthProvider.LOCAL) {
      throw new AppException(HttpStatus.FORBIDDEN, "Chỉ hỗ trợ đăng nhập LOCAL");
    }
  }

  private AppException invalidCredentialsException(String username) {
    //     auditLogService.log(
    //         null,
    //         username,
    //         AuditLogAction.LOGIN,
    //         AuditLogEntity.AUTH,
    //         null,
    //         AuditLogStatus.FAILED,
    //         "Đăng nhập thất bại do username không tồn tại");
    return new AppException(HttpStatus.UNAUTHORIZED, AuthMessage.INVALID_CREDENTIALS.getMessage());
  }

  private AppException invalidResetPasswordTokenException() {
    //     auditLogService.log(
    //         null,
    //         "anonymous",
    //         AuditLogAction.RESET_PASSWORD,
    //         AuditLogEntity.AUTH,
    //         null,
    //         AuditLogStatus.FAILED,
    //         "Đặt lại mật khẩu thất bại do token không hợp lệ");
    return new AppException(
        HttpStatus.UNAUTHORIZED, AuthMessage.INVALID_RESET_PASSWORD_TOKEN.getMessage());
  }
}
