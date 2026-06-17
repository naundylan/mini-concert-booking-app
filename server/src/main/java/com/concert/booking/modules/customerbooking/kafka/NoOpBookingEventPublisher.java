package com.concert.booking.modules.customerbooking.kafka;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@ConditionalOnProperty(
    prefix = "application.kafka",
    name = "enabled",
    havingValue = "false",
    matchIfMissing = true)
public class NoOpBookingEventPublisher implements BookingEventPublisher {

  @Override
  public void publishBookingPaid(BookingPaidEvent event) {
    log.debug("Kafka disabled; skip booking paid event. orderId={}", event.orderId());
  }
}
