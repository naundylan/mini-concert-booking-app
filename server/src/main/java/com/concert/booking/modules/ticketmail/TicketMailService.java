package com.concert.booking.modules.ticketmail;

import com.concert.booking.common.constants.TicketMailProperties;
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

  TicketMailAsyncService ticketMailAsyncService;
  TicketMailProperties ticketMailProperties;
  OrderRepository orderRepository;
  TicketRepository ticketRepository;
  EventRepository eventRepository;
  TicketClassRepository ticketClassRepository;
  UserRepository userRepository;

  public void sendTicketsForOrder(UUID orderId) {
    TicketMailDto mailDto = prepareTicketMail(orderId);
    if (mailDto != null) {
      ticketMailAsyncService.sendEmailAsync(mailDto);
    }
  }

  @Transactional
  public TicketMailDto prepareTicketMail(UUID orderId) {
    if (!ticketMailProperties.isEnabled()) {
      log.debug("Ticket mail disabled; skip ticket email. orderId={}", orderId);
      return null;
    }

    Order order =
        orderRepository
            .findById(orderId)
            .orElseThrow(() -> new IllegalStateException("Order not found: " + orderId));
    if (order.getStatus() != OrderStatus.PAID) {
      log.warn("Skip ticket email because order is not paid. orderId={}", orderId);
      return null;
    }

    // Idempotency check: Skip if SENT or PENDING
    if (order.getEmailStatus() == EmailStatus.SENT
        || order.getEmailStatus() == EmailStatus.PENDING) {
      log.info("Ticket email already sent or pending for orderId={}. Skip sending.", orderId);
      return null;
    }

    User customer =
        userRepository
            .findById(order.getCustomerId())
            .orElseThrow(
                () -> new IllegalStateException("Customer not found: " + order.getCustomerId()));
    if (customer.getEmail() == null || customer.getEmail().isBlank()) {
      log.info("Skip ticket email because customer email is empty. orderId={}", orderId);
      return null;
    }

    List<Ticket> tickets = ticketRepository.findByOrderId(orderId);
    if (tickets.isEmpty()) {
      log.warn("Skip ticket email because order has no tickets. orderId={}", orderId);
      return null;
    }

    Event event =
        eventRepository
            .findById(order.getEventId())
            .orElseThrow(() -> new IllegalStateException("Event not found: " + order.getEventId()));
    Map<UUID, TicketClass> ticketClassById =
        ticketClassRepository.findByEventId(order.getEventId()).stream()
            .collect(Collectors.toMap(TicketClass::getId, Function.identity()));

    // Mark as pending before attempt to avoid duplicate sends
    order.setEmailStatus(EmailStatus.PENDING);
    orderRepository.save(order);

    String body = buildTicketEmail(order, event, tickets, ticketClassById);

    return new TicketMailDto(
        orderId, customer.getEmail().trim(), ticketMailProperties.getSubject(), body);
  }

  private String buildTicketEmail(
      Order order, Event event, List<Ticket> tickets, Map<UUID, TicketClass> ticketClassById) {
    StringBuilder ticketRows = new StringBuilder();
    for (Ticket ticket : tickets) {
      TicketClass ticketClass = ticketClassById.get(ticket.getTicketClassId());
      ticketRows.append(
          """
          <tr>
            <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #1f2937;">%s</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; color: #4b5563;">%s</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; color: #059669; font-weight: bold;">%s</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; word-break: break-all;">
              <div style="font-family: monospace; color: #111827; font-size: 13px;">%s</div>
              <div style="margin-top: 8px;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=%s" alt="QR Code" style="border: 1px solid #e5e7eb; padding: 4px; border-radius: 6px; background-color: #ffffff;"/>
              </div>
            </td>
          </tr>
          """
              .formatted(
                  escape(ticket.getSeatLabel()),
                  escape(ticketClass != null ? ticketClass.getName() : "Hạng vé"),
                  formatMoney(ticket.getPrice()),
                  ticket.getId(),
                  ticket.getId()));
    }

    return """
        <html>
          <body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; background-color: #f3f4f6; margin: 0; padding: 20px;">
            <div style="max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #4f46e5 0%%, #7c3aed 100%%); padding: 32px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">Vé điện tử của bạn</h1>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 15px;">Cảm ơn bạn đã đồng hành cùng Mini Concert Booking</p>
              </div>
              <div style="padding: 32px;">
                <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">
                  Thông tin vé của đơn hàng: <strong style="color: #4f46e5; font-family: monospace; font-size: 18px;">%s</strong>
                </p>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <p style="margin: 0 0 10px; font-size: 15px; color: #4b5563;"><strong style="color: #1f2937;">Sự kiện:</strong> %s</p>
                  <p style="margin: 0 0 10px; font-size: 15px; color: #4b5563;"><strong style="color: #1f2937;">Địa điểm:</strong> %s</p>
                  <p style="margin: 0 0 10px; font-size: 15px; color: #4b5563;"><strong style="color: #1f2937;">Thời gian:</strong> %s</p>
                  <p style="margin: 0; font-size: 15px; color: #4b5563;"><strong style="color: #1f2937;">Tổng thanh toán:</strong> <span style="color: #059669; font-weight: bold;">%s</span></p>
                </div>
                <table style="width: 100%%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                      <th align="left" style="padding: 12px 10px; font-size: 14px; color: #374151; font-weight: bold;">Ghế</th>
                      <th align="left" style="padding: 12px 10px; font-size: 14px; color: #374151; font-weight: bold;">Hạng vé</th>
                      <th align="left" style="padding: 12px 10px; font-size: 14px; color: #374151; font-weight: bold;">Giá</th>
                      <th align="left" style="padding: 12px 10px; font-size: 14px; color: #374151; font-weight: bold;">Mã vé & QR Check-in</th>
                    </tr>
                  </thead>
                  <tbody>%s</tbody>
                </table>
                <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #4b5563; text-align: center; line-height: 1.5;">
                  <p style="margin: 0 0 8px; font-weight: bold; color: #1f2937;">📌 HƯỚNG DẪN CHECK-IN</p>
                  <p style="margin: 0 0 12px;">Vui lòng xuất trình mã QR code trên đây tại quầy check-in của sự kiện để quét mã và nhận vòng đeo tay hoặc thẻ vào cổng.</p>
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">Đây là email tự động được gửi từ hệ thống. Vui lòng không phản hồi email này.</p>
                </div>
              </div>
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
      return "Chưa cập nhật";
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
