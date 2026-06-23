package com.concert.booking.modules.ticketmail;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

import com.concert.booking.BaseIntegrationTest;
import com.concert.booking.modules.customerbooking.kafka.BookingPaidEvent;
import com.concert.booking.modules.event.Event;
import com.concert.booking.modules.event.EventRepository;
import com.concert.booking.modules.event.enums.EventStatus;
import com.concert.booking.modules.order.Order;
import com.concert.booking.modules.order.OrderRepository;
import com.concert.booking.modules.order.Ticket;
import com.concert.booking.modules.order.TicketRepository;
import com.concert.booking.modules.order.enums.EmailStatus;
import com.concert.booking.modules.order.enums.OrderStatus;
import com.concert.booking.modules.order.enums.PaymentMethod;
import com.concert.booking.modules.order.enums.TicketStatus;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.TicketClassRepository;
import com.concert.booking.modules.user.User;
import com.concert.booking.modules.user.UserRepository;
import com.concert.booking.modules.user.enums.UserRole;
import com.concert.booking.modules.user.enums.UserStatus;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

@EnabledIf("com.concert.booking.BaseIntegrationTest#isDockerAvailable")
@SpringBootTest(properties = "spring.kafka.listener.auto-startup=true")
@DirtiesContext
class BookingEmailKafkaIntegrationTest extends BaseIntegrationTest {

  @Autowired UserRepository userRepository;
  @Autowired EventRepository eventRepository;
  @Autowired TicketClassRepository ticketClassRepository;
  @Autowired OrderRepository orderRepository;
  @Autowired TicketRepository ticketRepository;

  @BeforeEach
  void setUpMimeMessageStub() {
    MimeMessage mimeMessage = new MimeMessage((Session) null);
    when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);
  }

  @Test
  void publishBookingPaidEvent_shouldTriggerAsyncEmailDelivery() throws Exception {
    // 1. Prepare data and save to PostgreSQL container via JPA repositories
    User customer = User.builder()
        .username("test_customer_kafka")
        .fullName("Test Customer Kafka")
        .email("test_cust_kafka@example.com")
        .role(UserRole.CUSTOMER)
        .status(UserStatus.ACTIVE)
        .build();
    customer = userRepository.save(customer);

    Event event = Event.builder()
        .name("My Concert Kafka")
        .location("Hanoi")
        .startTime(Timestamp.from(Instant.now().plus(Duration.ofDays(2))))
        .status(EventStatus.ONSALE)
        .build();
    event = eventRepository.save(event);

    TicketClass ticketClass = TicketClass.builder()
        .eventId(event.getId())
        .name("VIP")
        .colorCode("#FF0000")
        .price(new BigDecimal("1000000"))
        .build();
    ticketClass = ticketClassRepository.save(ticketClass);

    Order order = Order.builder()
        .orderCode("MCB-KAF-99")
        .customerId(customer.getId())
        .eventId(event.getId())
        .totalAmount(new BigDecimal("1000000"))
        .status(OrderStatus.PAID)
        .build();
    order = orderRepository.save(order);



    Ticket ticket = Ticket.builder()
        .orderId(order.getId())
        .ticketClassId(ticketClass.getId())
        .seatId(UUID.randomUUID())
        .seatLabel("A-01")
        .price(new BigDecimal("1000000"))
        .status(TicketStatus.UNUSED)
        .build();
    ticket = ticketRepository.save(ticket);

    // 2. Publish BookingPaidEvent to Kafka Container
    BookingPaidEvent paidEvent = new BookingPaidEvent(
        order.getId(),
        order.getOrderCode(),
        customer.getId(),
        event.getId(),
        order.getTotalAmount(),
        PaymentMethod.VIETQR,
        "TXN-KAFKA-999",
        List.of(ticket.getSeatId()),
        Instant.now()
    );

    kafkaTemplate.send("booking.paid", order.getId().toString(), paidEvent);

    // 3. Asynchronously wait and verify that MailSender is invoked by the Kafka Consumer
    boolean emailSent = false;
    for (int i = 0; i < 40; i++) {
      Thread.sleep(250);
      try {
        verify(javaMailSender, atLeastOnce()).send(any(MimeMessage.class));
        emailSent = true;
        break;
      } catch (Throwable ignored) {
        // Mail is sent asynchronously; retry until verification succeeds
      }
    }

    assertTrue(emailSent, "Email should be sent asynchronously via Kafka event consumption");
  }
}
