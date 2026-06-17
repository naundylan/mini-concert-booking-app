package com.concert.booking.modules.customerbooking.kafka;

public interface BookingEventPublisher {
  void publishBookingPaid(BookingPaidEvent event);
}
