package com.concert.booking.modules.ticketmail;

import com.concert.booking.common.constants.TicketMailProperties;
import com.concert.booking.core.mail.MailService;
import com.concert.booking.modules.event.Event;
import com.concert.booking.modules.event.EventRepository;
import com.concert.booking.modules.order.Order;
import com.concert.booking.modules.order.OrderRepository;
import com.concert.booking.modules.order.Ticket;
import com.concert.booking.modules.order.TicketRepository;
import com.concert.booking.modules.order.enums.EmailStatus;
import com.concert.booking.modules.order.enums.OrderStatus;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.TicketClassRepository;
import com.concert.booking.modules.user.User;
import com.concert.booking.modules.user.UserRepository;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.text.NumberFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TicketMailService {
  static final DateTimeFormatter DATE_TIME_FORMATTER =
      DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault());

  MailService mailService;
  TicketMailProperties ticketMailProperties;
  OrderRepository orderRepository;
  TicketRepository ticketRepository;
  EventRepository eventRepository;
  TicketClassRepository ticketClassRepository;
  UserRepository userRepository;

  @Transactional
  public void sendTicketsForOrder(UUID orderId) {
    if (!ticketMailProperties.isEnabled()) {
      log.debug("Ticket mail disabled; skip ticket email. orderId={}", orderId);
      return;
    }

    Order order =
        orderRepository
            .findById(orderId)
            .orElseThrow(() -> new IllegalStateException("Order not found: " + orderId));
    if (order.getStatus() != OrderStatus.PAID) {
      log.warn("Skip ticket email because order is not paid. orderId={}", orderId);
      return;
    }

    // Idempotency check
    if (order.getEmailStatus() == EmailStatus.SENT) {
      log.info("Ticket email already sent for orderId={}. Skip sending.", orderId);
      return;
    }

    User customer =
        userRepository
            .findById(order.getCustomerId())
            .orElseThrow(
                () -> new IllegalStateException("Customer not found: " + order.getCustomerId()));
    if (customer.getEmail() == null || customer.getEmail().isBlank()) {
      log.info("Skip ticket email because customer email is empty. orderId={}", orderId);
      return;
    }

    List<Ticket> tickets = ticketRepository.findByOrderId(orderId);
    if (tickets.isEmpty()) {
      log.warn("Skip ticket email because order has no tickets. orderId={}", orderId);
      return;
    }

    Event event =
        eventRepository
            .findById(order.getEventId())
            .orElseThrow(() -> new IllegalStateException("Event not found: " + order.getEventId()));
    Map<UUID, TicketClass> ticketClassById =
        ticketClassRepository.findByEventId(order.getEventId()).stream()
            .collect(Collectors.toMap(TicketClass::getId, Function.identity()));

    int maxAttempts = ticketMailProperties.getRetryMaxAttempts();
    long initialDelayMs = ticketMailProperties.getRetryInitialDelayMs();
    double multiplier = ticketMailProperties.getRetryMultiplier();

    // Idempotency check and status handling
    if (order.getEmailStatus() == EmailStatus.SENT) {
      log.info("Ticket email already sent for orderId={}. Skip sending.", orderId);
      return;
    }
    // Mark as pending before attempt to avoid duplicate sends on retries
    if (order.getEmailStatus() != EmailStatus.PENDING) {
      order.setEmailStatus(EmailStatus.PENDING);
      orderRepository.save(order);
    }

    // Retry loop unchanged
    int attempt = 0;
    long currentDelay = initialDelayMs;

    while (true) {
      try {
        attempt++;
        mailService.sendHtmlMail(
            customer.getEmail().trim(),
            ticketMailProperties.getSubject(),
            buildTicketEmail(order, event, tickets, ticketClassById));

        order.setEmailStatus(EmailStatus.SENT);
        orderRepository.save(order);
        log.info(
            "Sent ticket email. orderId={}, ticketCount={}, attempt={}",
            orderId,
            tickets.size(),
            attempt);
        break; // Success!
      } catch (Exception ex) {
        log.warn(
            "Gửi email vé thất bại lần {}. Đang thử lại sau {}ms...", attempt, currentDelay, ex);
        if (attempt >= maxAttempts) {
          order.setEmailStatus(EmailStatus.FAILED);
          orderRepository.save(order);
          throw new IllegalStateException(
              "Không thể gửi email sau " + maxAttempts + " lần thử", ex);
        }
        try {
          Thread.sleep(currentDelay);
        } catch (InterruptedException ie) {
          Thread.currentThread().interrupt();
          throw new IllegalStateException("Gửi email bị gián đoạn", ie);
        }
        currentDelay = (long) (currentDelay * multiplier);
      }
    }
  }

  private String buildTicketEmail(
      Order order, Event event, List<Ticket> tickets, Map<UUID, TicketClass> ticketClassById) {
    StringBuilder ticketRows = new StringBuilder();
    for (Ticket ticket : tickets) {
      TicketClass ticketClass = ticketClassById.get(ticket.getTicketClassId());
      ticketRows.append(
          """
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">%s</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">%s</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">%s</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; word-break: break-all;">
              <div>%s</div>
              <div style="margin-top: 5px;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=%s" alt="QR Code" style="border: 1px solid #e5e7eb; padding: 2px; border-radius: 4px;"/>
              </div>
            </td>
          </tr>
          """
              .formatted(
                  escape(ticket.getSeatLabel()),
                  escape(ticketClass != null ? ticketClass.getName() : "Hang ve"),
                  formatMoney(ticket.getPrice()),
                  ticket.getId(),
                  ticket.getId()));
    }

    return """
        <html>
          <body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
            <div style="max-width: 720px; margin: 0 auto; padding: 24px;">
              <h2 style="margin: 0 0 16px;">Ve dien tu cua ban</h2>
              <p style="margin: 0 0 16px;">Cam on ban da dat ve. Thong tin ve cua don hang %s:</p>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <p style="margin: 0 0 8px;"><strong>Su kien:</strong> %s</p>
                <p style="margin: 0 0 8px;"><strong>Dia diem:</strong> %s</p>
                <p style="margin: 0 0 8px;"><strong>Thoi gian:</strong> %s</p>
                <p style="margin: 0;"><strong>Tong tien:</strong> %s</p>
              </div>
              <table style="width: 100%%; border-collapse: collapse; border: 1px solid #e5e7eb;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th align="left" style="padding: 10px;">Ghe</th>
                    <th align="left" style="padding: 10px;">Hang ve</th>
                    <th align="left" style="padding: 10px;">Gia</th>
                    <th align="left" style="padding: 10px;">Ma ve</th>
                  </tr>
                </thead>
                <tbody>%s</tbody>
              </table>
            </div>
          </body>
        </html>
        """
        .formatted(
            escape(order.getOrderCode()),
            escape(event.getName()),
            escape(event.getLocation()),
            formatTimestamp(event.getStartTime()),
            formatMoney(order.getTotalAmount()),
            ticketRows);
  }

  private String escape(String value) {
    return HtmlUtils.htmlEscape(value == null ? "" : value);
  }

  private String formatTimestamp(Timestamp value) {
    if (value == null) {
      return "Chua cap nhat";
    }
    return DATE_TIME_FORMATTER.format(value.toInstant());
  }

  private String formatMoney(BigDecimal value) {
    if (value == null) {
      return "0 VND";
    }
    NumberFormat formatter = NumberFormat.getNumberInstance(Locale.forLanguageTag("vi-VN"));
    return formatter.format(value) + " VND";
  }
}
