package com.concert.booking.modules.user;

import com.concert.booking.modules.user.enums.UserRole;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

  Optional<User> findByUsername(String username);

  Optional<User> findByPhone(String phone);

  Optional<User> findByEmail(String email);

  List<User> findByRole(UserRole role);

  boolean existsByUsername(String username);

  boolean existsByPhone(String phone);

  boolean existsByEmail(String email);

  boolean existsByGoogleId(String googleId);

  Optional<User> findByGoogleId(String googleId);
}
