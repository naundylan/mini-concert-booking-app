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

    String body = buildTicketEmail(order, event, tickets, ticketClassById, customer);

    return new TicketMailDto(
        orderId, customer.getEmail().trim(), ticketMailProperties.getSubject(), body);
  }

  private String buildTicketEmail(
      Order order, Event event, List<Ticket> tickets, Map<UUID, TicketClass> ticketClassById, User customer) {
    StringBuilder ticketCards = new StringBuilder();
    for (Ticket ticket : tickets) {
      TicketClass ticketClass = ticketClassById.get(ticket.getTicketClassId());
      ticketCards.append(
          """
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px; background-color: #ffffff; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
              <tr>
                <td style="padding: 12px 16px; font-weight: bold; color: #1f2937; font-size: 15px;">
                  Ghế: <span style="color: #4f46e5;">%s</span>
                </td>
                <td align="right" style="padding: 12px 16px; color: #4b5563; font-size: 13px; font-weight: bold;">
                  %s
                </td>
              </tr>
            </table>
            <div style="padding: 16px;">
              <div style="margin-bottom: 12px;">
                <span style="font-size: 11px; color: #9ca3af; display: block; margin-bottom: 2px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Mã vé (Ticket ID)</span>
                <span style="font-family: monospace; font-size: 13px; color: #111827; word-break: break-all; display: block; background-color: #f3f4f6; padding: 6px 10px; border-radius: 4px; border: 1px solid #e5e7eb;">%s</span>
              </div>
              
              <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td valign="top">
                    <span style="font-size: 11px; color: #9ca3af; display: block; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Giá vé</span>
                    <span style="font-size: 15px; font-weight: bold; color: #059669;">%s</span>
                  </td>
                  <td valign="top" align="right">
                    <span style="font-size: 11px; color: #9ca3af; display: block; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Trạng thái</span>
                    <span style="font-size: 13px; font-weight: bold; color: #4f46e5;">Chưa sử dụng</span>
                  </td>
                </tr>
              </table>
              
              <div style="text-align: center; padding-top: 12px; border-top: 1px solid #f3f4f6;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=%s" alt="QR Code" style="border: 1px solid #e5e7eb; padding: 6px; border-radius: 8px; background-color: #ffffff; width: 130px; height: 130px; display: inline-block;"/>
                <p style="margin: 6px 0 0; font-size: 12px; color: #9ca3af; font-weight: bold;">Quét mã này tại cổng soát vé</p>
              </div>
            </div>
          </div>
          """
              .formatted(
                  escape(ticket.getSeatLabel()),
                  escape(ticketClass != null ? ticketClass.getName() : "Hạng vé"),
                  ticket.getId(),
                  formatMoney(ticket.getPrice()),
                  ticket.getId()));
    }

    String bannerHtml = "";
    if (event.getBannerUrl() != null && !event.getBannerUrl().isBlank()) {
      bannerHtml = """
        <div style="margin-bottom: 16px; border-radius: 8px; overflow: hidden; max-height: 220px;">
          <img src="%s" alt="Event Banner" style="width: 100%%; height: auto; display: block; border-radius: 8px;"/>
        </div>
      """.formatted(escape(event.getBannerUrl()));
    }

    return """
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <style>
              @media only screen and (max-width: 600px) {
                .email-container {
                  width: 100%% !important;
                  padding: 10px !important;
                }
                .body-padding {
                  padding: 16px !important;
                }
              }
            </style>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; line-height: 1.6; background-color: #f3f4f6; margin: 0; padding: 0;">
            <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6; padding: 20px 0;">
              <tr>
                <td align="center">
                  <div class="email-container" style="max-width: 600px; width: 95%%; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); text-align: left;">
                    <div style="background: linear-gradient(135deg, #4f46e5 0%%, #7c3aed 100%%); padding: 32px; text-align: center; color: #ffffff;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">Vé điện tử của bạn</h1>
                      <p style="margin: 8px 0 0; opacity: 0.9; font-size: 15px;">Cảm ơn bạn đã đồng hành cùng Mini Concert Booking</p>
                    </div>
                    <div class="body-padding" style="padding: 32px;">
                      <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">
                        Mã đơn đặt vé: <strong style="color: #4f46e5; font-family: monospace; font-size: 18px;">%s</strong>
                      </p>
                      
                      <!-- Customer Information -->
                      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 10px; font-size: 13px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">Thông tin khách đặt vé</h3>
                        <p style="margin: 0 0 6px; font-size: 14px; color: #374151;"><strong style="color: #4b5563;">Họ và tên:</strong> %s</p>
                        <p style="margin: 0 0 6px; font-size: 14px; color: #374151;"><strong style="color: #4b5563;">Số điện thoại:</strong> %s</p>
                        <p style="margin: 0; font-size: 14px; color: #374151;"><strong style="color: #4b5563;">Email:</strong> %s</p>
                      </div>

                      <!-- Event Information -->
                      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 12px; font-size: 13px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">Thông tin sự kiện</h3>
                        %s
                        <p style="margin: 10px 0 6px; font-size: 14px; color: #374151;"><strong style="color: #4b5563;">Sự kiện:</strong> %s</p>
                        <p style="margin: 0 0 6px; font-size: 14px; color: #374151;"><strong style="color: #4b5563;">Địa điểm:</strong> %s</p>
                        <p style="margin: 0 0 6px; font-size: 14px; color: #374151;"><strong style="color: #4b5563;">Thời gian:</strong> %s</p>
                        <p style="margin: 0; font-size: 14px; color: #374151;"><strong style="color: #4b5563;">Tổng thanh toán:</strong> <span style="color: #059669; font-weight: bold;">%s</span></p>
                      </div>

                      <h3 style="margin: 0 0 16px; font-size: 14px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;">Danh sách vé của bạn</h3>
                      %s

                      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #4b5563; text-align: center; line-height: 1.5;">
                        <p style="margin: 0 0 8px; font-weight: bold; color: #1f2937;">📌 HƯỚNG DẪN CHECK-IN</p>
                        <p style="margin: 0 0 12px;">Vui lòng xuất trình mã QR code trên đây tại quầy check-in của sự kiện để soát vé và nhận vòng đeo tay hoặc vé cứng vào cổng.</p>
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">Đây là email tự động được gửi từ hệ thống. Vui lòng không phản hồi email này.</p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </body>
        </html>
        """
        .formatted(
            escape(order.getOrderCode()),
            escape(customer.getFullName()),
            escape(customer.getPhone()),
            escape(customer.getEmail()),
            bannerHtml,
            escape(event.getName()),
            escape(event.getLocation()),
            formatTimestamp(event.getStartTime()),
            formatMoney(order.getTotalAmount()),
            ticketCards);
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
