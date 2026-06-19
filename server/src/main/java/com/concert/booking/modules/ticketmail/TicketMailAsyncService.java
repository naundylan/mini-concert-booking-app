package com.concert.booking.modules.ticketmail;

import com.concert.booking.core.mail.MailService;
import com.concert.booking.modules.order.Order;
import com.concert.booking.modules.order.OrderRepository;
import com.concert.booking.modules.order.enums.EmailStatus;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TicketMailAsyncService {

  MailService mailService;
  OrderRepository orderRepository;

  @Async("ticketMailExecutor")
  @Retryable(
      retryFor = {Exception.class},
      maxAttemptsExpression = "#{@ticketMailProperties.retryMaxAttempts}",
      backoff =
          @Backoff(
              delayExpression = "#{@ticketMailProperties.retryInitialDelayMs}",
              multiplierExpression = "#{@ticketMailProperties.retryMultiplier}"))
  public void sendEmailAsync(TicketMailDto dto) {
    log.debug("Attempting to send ticket email for orderId: {}", dto.orderId());
    mailService.sendHtmlMail(dto.email().trim(), dto.subject(), dto.body());

    // Update status to SENT upon success
    updateEmailStatus(dto.orderId(), EmailStatus.SENT);
    log.info("Successfully sent ticket email for orderId: {}", dto.orderId());
  }

  @Recover
  public void recover(Exception e, TicketMailDto dto) {
    log.error(
        "Failed to send ticket email after retries for orderId: {}. Marking as FAILED.",
        dto.orderId(),
        e);
    updateEmailStatus(dto.orderId(), EmailStatus.FAILED);
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void updateEmailStatus(UUID orderId, EmailStatus status) {
    Order order = orderRepository.findById(orderId).orElse(null);
    if (order != null) {
      order.setEmailStatus(status);
      orderRepository.save(order);
      log.debug("Updated orderId {} emailStatus to {}", orderId, status);
    }
  }
}
