package com.concert.booking.modules.order;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, UUID> {
  boolean existsByOrderCode(String orderCode);

  Optional<Order> findByOrderCode(String orderCode);
}
