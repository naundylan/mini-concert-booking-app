package com.concert.booking.modules.auth;

import com.concert.booking.common.constants.JwtProperties;
import com.concert.booking.common.exception.AppException;
import com.concert.booking.core.auth.TokenBlacklistService;
import com.concert.booking.core.ratelimit.RateLimiterService;
// import com.concert.booking.modules.audit.AuditLogService;
import com.concert.booking.modules.auth.dto.*;
import com.concert.booking.modules.auth.security.JwtService;
import com.concert.booking.modules.user.*;
import com.concert.booking.modules.user.enums.AuthProvider;
import com.concert.booking.modules.user.enums.UserRole;
import com.concert.booking.modules.user.enums.UserStatus;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
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
        .role(user.getRole().name())
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


  @Override
  @Transactional
  public OAuth2LoginDTO processOAuth2Customer(OAuth2User oAuth2User) {
    String email = oAuth2User.getAttribute("email");
    String googleId = oAuth2User.getAttribute("sub");
    String fullName = oAuth2User.getAttribute("name");

    // Tìm User
    User user = userRepository.findByGoogleId(googleId)
        .map(existingUser -> {
          existingUser.setFullName(fullName);
          return userRepository.save(existingUser);
        })
        .orElseGet(() -> userRepository.findByEmail(email)
            .map(existingUser -> {
              existingUser.setGoogleId(googleId);
              existingUser.setAuthProvider(AuthProvider.GOOGLE);
              existingUser.setOnlineVerified(true);
              existingUser.setFullName(fullName);
              return userRepository.save(existingUser);
            })
            .orElse(null) // Nếu không tìm thấy, trả về null
        );

    UserInfo userInfo;
    if (user != null) {
      // User tồn tại
      userInfo = UserInfo.builder()
          .email(user.getEmail())
          .phone(user.getPhone())
          .fullName(user.getFullName())
          .googleId(user.getGoogleId())
          .role(user.getRole().name())
          .status(user.getStatus().name())
          .build();

      // Nếu có số điện thoại -> Sinh token
      if (user.getPhone() != null) {
        String accessToken = jwtService.generateAccessToken(user.getId());
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        return OAuth2LoginDTO.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .accessTokenExpiration(jwtProperties.getAccessTokenExpiration())
            .refreshTokenExpiration(jwtProperties.getRefreshTokenExpiration())
            .userInfo(userInfo)
            .build();
      } else {
        // Có user nhưng không có phone -> Chỉ trả về UserInfo để FE nhập thêm
        return OAuth2LoginDTO.builder()
            .userInfo(userInfo)
            .build();
      }
    } else {
      // User mới (chưa có trong DB)
      userInfo = UserInfo.builder()
          .email(email)
          .phone(null)
          .fullName(fullName)
          .googleId(googleId)
          .role(UserRole.CUSTOMER.name())
          .status(UserStatus.ACTIVE.name())
          .build();

      // Trả về UserInfo để FE nhập phone
      return OAuth2LoginDTO.builder()
          .userInfo(userInfo)
          .build();
    }
  }

  @Override
  @Transactional
  public OAuth2LoginDTO completeOAuth2CustomerPhone(OAuth2CallbackDTO dto) {
    String email = dto.getEmail();
    String phone = dto.getPhone();
    String googleId = dto.getGoogleId();
    String fullName = dto.getFullName();

    // Tìm user bằng email HOẶC phone (merge logic: user POS có phone nhưng chưa có email)
    Optional<User> userByEmail = userRepository.findByEmail(email);
    Optional<User> userByPhone = userRepository.findByPhone(phone);

    User user;

    if (userByEmail.isPresent() && userByPhone.isPresent()) {
      // Cả email và phone đều tồn tại → phải là cùng một user
      User userFromEmail = userByEmail.get();
      User userFromPhone = userByPhone.get();

      if (!userFromEmail.getId().equals(userFromPhone.getId())) {
        // Email và phone thuộc về 2 user khác nhau → lỗi
        throw new AppException(HttpStatus.BAD_REQUEST, 
            "Email và số điện thoại không thuộc về cùng một tài khoản. Vui lòng liên hệ hỗ trợ.");
      }

      user = userFromEmail; // Cùng user
    } else if (userByEmail.isPresent()) {
      user = userByEmail.get();
      // User có email nhưng chưa có phone (chưa hoàn tất OAuth2) → update phone
    } else if (userByPhone.isPresent()) {
      user = userByPhone.get();
      // User từ POS có phone nhưng chưa có email → merge email, googleId, fullName
    } else {
      // Không tìm thấy user nào → tạo mới
      user = null;
    }

    if (user != null) {
      // User tồn tại (từ web hoặc POS) → merge thông tin
      // Kiểm tra trùng lặp nếu thay đổi email/phone
      if ((user.getEmail() == null || !email.equals(user.getEmail())) && userRepository.existsByEmail(email)) {
        throw new AppException(HttpStatus.BAD_REQUEST, "Email đã được sử dụng bởi tài khoản khác");
      }
      if ((user.getPhone() == null || !phone.equals(user.getPhone())) && userRepository.existsByPhone(phone)) {
        throw new AppException(HttpStatus.BAD_REQUEST, "Số điện thoại đã được sử dụng bởi tài khoản khác");
      }

      user.setEmail(email);
      user.setGoogleId(googleId);
      user.setFullName(fullName);
      user.setPhone(phone);
      user.setAuthProvider(AuthProvider.GOOGLE);
      user.setOnlineVerified(true);
      user.setTokensValidFrom(Instant.now()); // Invalidate old tokens
      userRepository.save(user);
    } else {
      // Tạo user mới hoàn toàn
      if (userRepository.existsByEmail(email)) {
        throw new AppException(HttpStatus.BAD_REQUEST, "Email đã tồn tại trên hệ thống");
      }
      if (userRepository.existsByPhone(phone)) {
        throw new AppException(HttpStatus.BAD_REQUEST, "Số điện thoại đã tồn tại trên hệ thống");
      }

      user = User.builder()
          .email(email)
          .googleId(googleId)
          .fullName(fullName)
          .phone(phone)
          .authProvider(AuthProvider.GOOGLE)
          .role(UserRole.CUSTOMER)
          .status(UserStatus.ACTIVE)
          .onlineVerified(true)
          .tokensValidFrom(Instant.now())
          .build();
      userRepository.save(user);
    }

    // Tạo token và trả về
    UserInfo userInfo = UserInfo.builder()
        .email(user.getEmail())
        .phone(user.getPhone())
        .fullName(user.getFullName())
        .googleId(user.getGoogleId())
        .role(user.getRole().name())
        .status(user.getStatus().name())
        .build();

    String accessToken = jwtService.generateAccessToken(user.getId());
    String refreshToken = jwtService.generateRefreshToken(user.getId());

    return OAuth2LoginDTO.builder()
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .accessTokenExpiration(jwtProperties.getAccessTokenExpiration())
        .refreshTokenExpiration(jwtProperties.getRefreshTokenExpiration())
        .userInfo(userInfo)
        .build();
  }
}
