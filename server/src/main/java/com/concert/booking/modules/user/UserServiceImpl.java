package com.concert.booking.modules.user;

import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.auth.security.CustomUserDetails;
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

        User user = User.builder()
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

        User user = User.builder()
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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
        return CustomUserDetails.builder().user(user).build();
    }
}