package com.concert.booking.modules.user;

import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.auth.security.CustomUserDetails;
import com.concert.booking.modules.user.dto.CreateCustomerDTO;
import com.concert.booking.modules.user.dto.CreateStaffDTO;
import com.concert.booking.modules.user.dto.ResetStaffPasswordDTO;
import com.concert.booking.modules.user.dto.UpdateStaffStatusDTO;
import com.concert.booking.modules.user.dto.UpdateStaffDTO;
import java.util.List;
import com.concert.booking.modules.user.enums.AuthProvider;
import com.concert.booking.modules.user.enums.UserRole;
import com.concert.booking.modules.user.enums.UserStatus;
import com.concert.booking.modules.audit.AuditLogService;
import com.concert.booking.modules.audit.enums.AuditLogAction;
import com.concert.booking.modules.audit.enums.AuditLogEntity;
import com.concert.booking.modules.audit.enums.AuditLogStatus;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserServiceImpl implements UserService {

  UserRepository userRepository;
  PasswordEncoder passwordEncoder;
  AuditLogService auditLogService;

  @Override
  @Transactional
  public User createStaff(CreateStaffDTO dto, UUID createdBy) {
    String phone = (dto.getPhone() == null || dto.getPhone().isBlank()) ? null : dto.getPhone().trim();
    String email = (dto.getEmail() == null || dto.getEmail().isBlank()) ? null : dto.getEmail().trim();

    if (phone != null && userRepository.existsByPhone(phone)) {
      throw new AppException(HttpStatus.CONFLICT, "Số điện thoại đã tồn tại");
    }
    if (email != null && userRepository.existsByEmail(email)) {
      throw new AppException(HttpStatus.CONFLICT, "Email đã tồn tại");
    }
    if (userRepository.existsByUsername(dto.getUsername())) {
      throw new AppException(HttpStatus.CONFLICT, "Tên đăng nhập đã tồn tại");
    }

    User user =
        User.builder()
            .phone(phone)
            .email(email)
            .fullName(dto.getFullName().trim())
            .username(dto.getUsername().trim())
            .passwordHash(passwordEncoder.encode(dto.getPassword()))
            .role(UserRole.STAFF)
            .authProvider(AuthProvider.LOCAL)
            .status(UserStatus.ACTIVE)
            .createdBy(createdBy)
            .build();

    User saved = userRepository.save(user);

    auditLogService.log(
        createdBy,
        "ADMIN",
        AuditLogAction.CREATE,
        AuditLogEntity.USER,
        saved.getId().toString(),
        AuditLogStatus.SUCCESS,
        "Admin tạo nhân viên mới: " + saved.getUsername()
    );

    return saved;
  }

  @Override
  @Transactional
  public User createCustomer(CreateCustomerDTO dto, UUID createdBy) {
    if (userRepository.existsByPhone(dto.getPhone())) {
      throw new AppException(HttpStatus.CONFLICT, "Số điện thoại đã tồn tại");
    }

    User user =
        User.builder()
            .phone(dto.getPhone())
            .fullName(dto.getFullName())
            .role(UserRole.CUSTOMER)
            .authProvider(AuthProvider.LOCAL)
            .status(UserStatus.ACTIVE)
            .onlineVerified(false)
            .createdBy(createdBy)
            .build();

    return userRepository.save(user);
  }

  @Override
  public CustomUserDetails loadUserById(UUID userId) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
    return CustomUserDetails.builder().user(user).build();
  }

  @Override
  @Transactional
  public void updateStaffStatus(UUID staffId, UpdateStaffStatusDTO dto, UUID updatedBy) {
    User staff =
        userRepository
            .findById(staffId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Staff không tồn tại"));

    if (staff.getRole() != UserRole.STAFF) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Người dùng này không phải là Staff");
    }

    UserStatus oldStatus = staff.getStatus();
    staff.setStatus(dto.getStatus());
    staff.setUpdatedBy(updatedBy);

    // Force logout if status changed to INACTIVE
    if (dto.getStatus() == UserStatus.INACTIVE) {
      staff.setTokensValidFrom(Instant.now());
    }

    User saved = userRepository.save(staff);

    auditLogService.log(
        updatedBy,
        "ADMIN",
        AuditLogAction.UPDATE,
        AuditLogEntity.USER,
        saved.getId().toString(),
        AuditLogStatus.SUCCESS,
        "Admin cập nhật trạng thái nhân viên " + saved.getUsername() + " từ " + oldStatus + " sang " + dto.getStatus()
    );
  }

  @Override
  @Transactional
  public void resetStaffPassword(UUID staffId, ResetStaffPasswordDTO dto, UUID updatedBy) {
    User staff =
        userRepository
            .findById(staffId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Staff không tồn tại"));

    if (staff.getRole() != UserRole.STAFF) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Người dùng này không phải là Staff");
    }

    staff.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
    staff.setUpdatedBy(updatedBy);
    // Force logout by invalidating all existing tokens
    staff.setTokensValidFrom(Instant.now());

    User saved = userRepository.save(staff);

    auditLogService.log(
        updatedBy,
        "ADMIN",
        AuditLogAction.UPDATE,
        AuditLogEntity.USER,
        saved.getId().toString(),
        AuditLogStatus.SUCCESS,
        "Admin đặt lại mật khẩu cho nhân viên: " + saved.getUsername()
    );
  }

  @Override
  @Transactional(readOnly = true)
  public List<User> getAllStaff() {
    return userRepository.findByRole(UserRole.STAFF);
  }

  @Override
  @Transactional
  public User updateStaff(UUID staffId, UpdateStaffDTO dto, UUID updatedBy) {
    User staff =
        userRepository
            .findById(staffId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Staff không tồn tại"));

    if (staff.getRole() != UserRole.STAFF) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Người dùng này không phải là Staff");
    }

    String phone = (dto.getPhone() == null || dto.getPhone().isBlank()) ? null : dto.getPhone().trim();
    String email = (dto.getEmail() == null || dto.getEmail().isBlank()) ? null : dto.getEmail().trim();
    String username = dto.getUsername().trim();

    // Validate unique phone
    if (phone != null) {
      userRepository
          .findByPhone(phone)
          .filter(u -> !u.getId().equals(staffId))
          .ifPresent(
              u -> {
                throw new AppException(HttpStatus.CONFLICT, "Số điện thoại đã tồn tại");
              });
    }

    // Validate unique email
    if (email != null) {
      userRepository
          .findByEmail(email)
          .filter(u -> !u.getId().equals(staffId))
          .ifPresent(
              u -> {
                throw new AppException(HttpStatus.CONFLICT, "Email đã tồn tại");
              });
    }

    // Validate unique username
    userRepository
        .findByUsername(username)
        .filter(u -> !u.getId().equals(staffId))
        .ifPresent(
            u -> {
              throw new AppException(HttpStatus.CONFLICT, "Tên đăng nhập đã tồn tại");
            });

    staff.setFullName(dto.getFullName().trim());
    staff.setPhone(phone);
    staff.setEmail(email);
    staff.setUsername(username);
    staff.setUpdatedBy(updatedBy);

    User saved = userRepository.save(staff);

    auditLogService.log(
        updatedBy,
        "ADMIN",
        AuditLogAction.UPDATE,
        AuditLogEntity.USER,
        saved.getId().toString(),
        AuditLogStatus.SUCCESS,
        "Admin cập nhật thông tin chi tiết của nhân viên: " + saved.getUsername()
    );

    return saved;
  }

  @Override
  @Transactional(readOnly = true)
  public User getUserProfile(UUID userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));
  }

  @Override
  @Transactional
  public User updateCustomerProfile(UUID userId, String fullName) {
    User customer = userRepository.findById(userId)
        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

    if (fullName == null || fullName.trim().isBlank()) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Họ và tên không được để trống");
    }

    customer.setFullName(fullName.trim());
    customer.setUpdatedBy(userId);

    return userRepository.save(customer);
  }
}

