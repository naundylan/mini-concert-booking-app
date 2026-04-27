package com.concert.booking.modules.user;

import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.auth.security.CustomUserDetails;
import com.concert.booking.modules.user.dto.CreateCustomerDTO;
import com.concert.booking.modules.user.dto.CreateStaffDTO;
import com.concert.booking.modules.user.dto.ResetStaffPasswordDTO;
import com.concert.booking.modules.user.dto.UpdateStaffStatusDTO;
import com.concert.booking.modules.user.enums.AuthProvider;
import com.concert.booking.modules.user.enums.UserRole;
import com.concert.booking.modules.user.enums.UserStatus;
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

  @Override
  @Transactional
  public User createStaff(CreateStaffDTO dto, UUID createdBy) {
    if (userRepository.existsByPhone(dto.getPhone())) {
      throw new AppException(HttpStatus.CONFLICT, "Số điện thoại đã tồn tại");
    }
    if (userRepository.existsByUsername(dto.getUsername())) {
      throw new AppException(HttpStatus.CONFLICT, "Tên đăng nhập đã tồn tại");
    }

    User user =
        User.builder()
            .phone(dto.getPhone())
            .fullName(dto.getFullName())
            .username(dto.getUsername())
            .passwordHash(passwordEncoder.encode(dto.getPassword()))
            .role(UserRole.STAFF)
            .authProvider(AuthProvider.LOCAL)
            .status(UserStatus.ACTIVE)
            .createdBy(createdBy)
            .build();

    return userRepository.save(user);
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

    staff.setStatus(dto.getStatus());
    staff.setUpdatedBy(updatedBy);

    // Force logout if status changed to INACTIVE
    if (dto.getStatus() == UserStatus.INACTIVE) {
      staff.setTokensValidFrom(Instant.now());
    }

    userRepository.save(staff);
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

    userRepository.save(staff);
  }
}
