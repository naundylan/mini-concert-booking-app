package com.concert.booking.modules.order;

import com.concert.booking.modules.order.enums.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, UUID> {
  boolean existsByOrderCode(String orderCode);

  Optional<Order> findByOrderCode(String orderCode);

  @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = :status AND o.createdAt >= :start AND o.createdAt < :end")
  Optional<BigDecimal> sumRevenueBetween(
      @Param("status") OrderStatus status,
      @Param("start") Instant start,
      @Param("end") Instant end);

  @Query("SELECT o FROM Order o WHERE o.status = com.concert.booking.modules.order.enums.OrderStatus.PAID AND o.createdAt >= :startDate")
  java.util.List<Order> findPaidOrdersSince(@Param("startDate") Instant startDate);


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

  @Query(
      """
      SELECT o
      FROM Order o
      JOIN User u ON u.id = o.customerId
      WHERE (:eventId IS NULL OR o.eventId = :eventId)
        AND (:status IS NULL OR o.status = :status)
        AND (
          :keyword IS NULL OR :keyword = ''
          OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
          OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
          OR u.phone LIKE CONCAT('%', :keyword, '%')
          OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
      """)
  Page<Order> searchAdminOrders(
      @Param("keyword") String keyword,
      @Param("eventId") UUID eventId,
      @Param("status") OrderStatus status,
      Pageable pageable);
}

