package com.concert.booking.modules.layout;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SeatLayoutRepository extends JpaRepository<SeatLayout, UUID> {
  @Query(
      """
      SELECT l
      FROM SeatLayout l
      WHERE (:status IS NULL OR l.status = :status)
        AND (
          :keyword IS NULL
          OR :keyword = ''
          OR LOWER(l.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
          OR LOWER(l.venueName) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
      ORDER BY l.updatedAt DESC
      """)
  Page<SeatLayout> search(
      @Param("keyword") String keyword, @Param("status") LayoutStatus status, Pageable pageable);
}
