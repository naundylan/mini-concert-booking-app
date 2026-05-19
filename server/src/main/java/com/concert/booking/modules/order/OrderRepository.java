package com.concert.booking.modules.order;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, UUID> {
  boolean existsByOrderCode(String orderCode);

  Optional<Order> findByOrderCode(String orderCode);

  @Query(
      """
      SELECT o
      FROM Order o
      JOIN User u ON u.id = o.customerId
      WHERE o.eventId = :eventId
        AND (
          LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
          OR u.phone LIKE CONCAT('%', :keyword, '%')
        )
      ORDER BY o.createdAt DESC
      """)
  java.util.List<Order> searchCheckInOrders(
      @Param("eventId") UUID eventId, @Param("keyword") String keyword);
}
