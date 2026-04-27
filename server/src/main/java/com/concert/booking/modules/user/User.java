package com.concert.booking.modules.user;

import com.concert.booking.common.entity.AbstractAuditEntity;
import com.concert.booking.modules.user.enums.AuthProvider;
import com.concert.booking.modules.user.enums.UserRole;
import com.concert.booking.modules.user.enums.UserStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(
    name = "users",
    indexes = {
      @Index(name = "idx_user_phone", columnList = "phone"),
      @Index(name = "idx_user_email", columnList = "email"),
      @Index(name = "idx_user_role", columnList = "role"),
      @Index(name = "idx_user_status", columnList = "status")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User extends AbstractAuditEntity {

  @Id
  @GeneratedValue
  @UuidGenerator(style = UuidGenerator.Style.TIME)
  UUID id;

  @Column(length = 20, nullable = false, unique = true)
  String phone; // Mỏ neo chính - Bắt buộc với MỌI user

  @Column(length = 100, unique = true)
  String username; // Chỉ dành cho ADMIN/STAFF (LOCAL)

  @Column(unique = true, length = 255)
  String email; // Dành cho GĐ2 (GOOGLE) hoặc email nội bộ

  @Column(name = "google_id", unique = true, length = 255)
  String googleId; // Dành cho GĐ2 (GOOGLE)

  // --- USER INFO ---

  @Column(name = "full_name", length = 255, nullable = false)
  String fullName;

  @Builder.Default
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  UserRole role = UserRole.CUSTOMER;

  @Builder.Default
  @Enumerated(EnumType.STRING)
  @Column(name = "auth_provider", nullable = false, length = 20)
  AuthProvider authProvider = AuthProvider.LOCAL;

  @Builder.Default
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  UserStatus status = UserStatus.ACTIVE;

  @Column(name = "password_hash", length = 255)
  String passwordHash; // Chỉ có khi authProvider = LOCAL (Admin/Staff)

  @Column(name = "tokens_valid_from")
  Instant tokensValidFrom; // Timestamp để invalidate tất cả tokens cũ

  // createdAt, updatedAt, createdBy, updatedBy inherited from AbstractAuditEntity
}
