package com.concert.booking.modules.order;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
  Optional<Payment> findByOrderId(UUID orderId);

  Optional<Payment> findByTransactionRef(String transactionRef);
}
