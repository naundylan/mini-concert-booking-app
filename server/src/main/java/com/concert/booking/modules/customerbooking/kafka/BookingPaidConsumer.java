package com.concert.booking.modules.customerbooking.kafka;

import com.concert.booking.modules.ticketmail.TicketMailService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@ConditionalOnProperty(prefix = "application.kafka", name = "enabled", havingValue = "true")
public class BookingPaidConsumer {
  TicketMailService ticketMailService;

  @KafkaListener(
      topics = "${application.kafka.topics.bookingPaid}",
      containerFactory = "kafkaListenerContainerFactory")
  public void handleBookingPaid(BookingPaidEvent event) {
    log.info(
        "Consumed booking paid event. orderId={}, orderCode={}, paymentMethod={}",
        event.orderId(),
        event.orderCode(),
        event.paymentMethod());
    ticketMailService.sendTicketsForOrder(event.orderId());
  }
}
