package com.concert.booking.modules.booking;

import java.util.UUID;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
  boolean existsByBookingCode(String bookingCode);

  Optional<Booking> findByBookingCode(String bookingCode);
}
