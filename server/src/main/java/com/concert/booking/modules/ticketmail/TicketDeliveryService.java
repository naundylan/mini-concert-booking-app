package com.concert.booking.modules.ticketmail;

import com.concert.booking.common.constants.TicketMailProperties;
import com.concert.booking.common.web.RequestLoadTracker;
import com.concert.booking.modules.customerbooking.kafka.BookingEventPublisher;
import com.concert.booking.modules.customerbooking.kafka.BookingPaidEvent;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TicketDeliveryService {
  final TicketMailService ticketMailService;
  final BookingEventPublisher bookingEventPublisher;
  final TicketMailProperties ticketMailProperties;
  final RequestLoadTracker requestLoadTracker;

  @Value("${application.kafka.enabled:false}")
  boolean kafkaEnabled;

  public void deliverTicketsAfterCommit(BookingPaidEvent event) {
    if (!TransactionSynchronizationManager.isSynchronizationActive()) {
      deliverTicketsAfterPayment(event);
      return;
    }

    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronization() {
          @Override
          public void afterCommit() {
            deliverTicketsAfterPayment(event);
          }
        });
  }

  public void deliverTicketsAfterPayment(BookingPaidEvent event) {
    if (!ticketMailProperties.isEnabled()) {
      log.debug("Ticket mail disabled; skip delivery. orderId={}", event.orderId());
      return;
    }

    if (shouldQueueToKafka()) {
      bookingEventPublisher.publishBookingPaid(event);
      return;
    }

    sendDirect(event);
  }

  private boolean shouldQueueToKafka() {
    if (!kafkaEnabled) {
      return false;
    }

    String mode = ticketMailProperties.getDeliveryMode();
    if (mode == null || mode.isBlank()) {
      mode = "auto";
    }

    return switch (mode.trim().toLowerCase()) {
      case "kafka" -> true;
      case "direct" -> false;
      case "auto" ->
          requestLoadTracker.getActiveRequestCount()
              >= ticketMailProperties.getHighLoadActiveRequests();
      default -> {
        log.warn("Unknown ticket mail delivery mode '{}'; fallback to direct", mode);
        yield false;
      }
    };
  }

  private void sendDirect(BookingPaidEvent event) {
    try {
      ticketMailService.sendTicketsForOrder(event.orderId());
    } catch (Exception ex) {
      log.error("Failed to send ticket email. orderId={}", event.orderId(), ex);
    }
  }
}
