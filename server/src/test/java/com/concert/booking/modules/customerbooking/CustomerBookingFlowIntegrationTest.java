package com.concert.booking.modules.customerbooking;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.concert.booking.BaseIntegrationTest;
import com.concert.booking.common.dto.DataApiResponse;
import com.concert.booking.modules.auth.security.CustomUserDetails;
import com.concert.booking.modules.customerbooking.dto.*;
import com.concert.booking.modules.event.Event;
import com.concert.booking.modules.event.EventRepository;
import com.concert.booking.modules.event.enums.EventStatus;
import com.concert.booking.modules.order.Order;
import com.concert.booking.modules.order.OrderRepository;
import com.concert.booking.modules.order.Payment;
import com.concert.booking.modules.order.PaymentRepository;
import com.concert.booking.modules.order.Ticket;
import com.concert.booking.modules.order.TicketRepository;
import com.concert.booking.modules.order.dto.OrderResponseDTO;
import com.concert.booking.modules.order.enums.OrderStatus;
import com.concert.booking.modules.order.enums.PaymentMethod;
import com.concert.booking.modules.order.enums.PaymentStatus;
import com.concert.booking.modules.order.enums.TicketStatus;
import com.concert.booking.modules.seat.Seat;
import com.concert.booking.modules.seat.SeatRepository;
import com.concert.booking.modules.seat.enums.SeatStatus;
import com.concert.booking.modules.seat.redis.SeatHoldRedisService;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.TicketClassRepository;
import com.concert.booking.modules.user.User;
import com.concert.booking.modules.user.UserRepository;
import com.concert.booking.modules.user.enums.UserRole;
import com.concert.booking.modules.user.enums.UserStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

@EnabledIf("com.concert.booking.BaseIntegrationTest#isDockerAvailable")
@SpringBootTest(properties = "spring.kafka.listener.auto-startup=true")
@DirtiesContext
class CustomerBookingFlowIntegrationTest extends BaseIntegrationTest {

  @Autowired ObjectMapper objectMapper;
  @Autowired UserRepository userRepository;
  @Autowired EventRepository eventRepository;
  @Autowired TicketClassRepository ticketClassRepository;
  @Autowired SeatRepository seatRepository;
  @Autowired OrderRepository orderRepository;
  @Autowired PaymentRepository paymentRepository;
  @Autowired TicketRepository ticketRepository;

  @Autowired CustomerBookingService customerBookingService;
  @Autowired SeatHoldRedisService seatHoldRedisService;

  private User customer;
  private CustomUserDetails customerDetails;
  private Event event;
  private TicketClass ticketClass;
  private Seat seat1;
  private Seat seat2;

  @BeforeEach
  void setUpMimeMessageAndData() {
    // 1. Stub JavaMailSender for asynchronous email sending check
    MimeMessage mimeMessage = new MimeMessage((Session) null);
    when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

    // 2. Setup database records in PostgreSQL container
    customer = User.builder()
        .username("flow_customer")
        .fullName("Flow Customer Test")
        .email("flow_customer@example.com")
        .role(UserRole.CUSTOMER)
        .status(UserStatus.ACTIVE)
        .build();
    customer = userRepository.save(customer);
    customerDetails = new CustomUserDetails(customer);

    event = Event.builder()
        .name("Modular Monolith Concert")
        .location("Ho Chi Minh City")
        .startTime(Timestamp.from(Instant.now().plus(Duration.ofDays(5))))
        .status(EventStatus.ONSALE)
        .build();
    event = eventRepository.save(event);

    ticketClass = TicketClass.builder()
        .eventId(event.getId())
        .name("VIP Zone")
        .colorCode("#FFCC00")
        .price(new BigDecimal("1200000"))
        .build();
    ticketClass = ticketClassRepository.save(ticketClass);

    seat1 = Seat.builder()
        .eventId(event.getId())
        .ticketClassId(ticketClass.getId())
        .gridRow(0)
        .gridColumn(1)
        .status(SeatStatus.AVAILABLE)
        .build();
    seat1 = seatRepository.save(seat1);

    seat2 = Seat.builder()
        .eventId(event.getId())
        .ticketClassId(ticketClass.getId())
        .gridRow(0)
        .gridColumn(2)
        .status(SeatStatus.AVAILABLE)
        .build();
    seat2 = seatRepository.save(seat2);
  }

  @Test
  void completeCheckoutAndPaymentFlow_shouldSucceedWithDatabaseRedisAndKafkaIntegration() throws Exception {
    // --- STEP 1: API /checkout - Hold seats in Redis ---
    CheckoutRequestDTO checkoutRequest = CheckoutRequestDTO.builder()
        .eventId(event.getId())
        .seatIds(List.of(seat1.getId(), seat2.getId()))
        .paymentMethod(PaymentMethod.BANK_TRANSFER)
        .build();

    MvcResult mvcResult = mockMvc.perform(post("/api/v1/customer/checkout")
            .with(user(customerDetails))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(checkoutRequest)))
        .andExpect(status().isOk())
        .andReturn();

    String jsonResponse = mvcResult.getResponse().getContentAsString();
    DataApiResponse<?> apiResponse = objectMapper.readValue(jsonResponse, DataApiResponse.class);
    assertNotNull(apiResponse);
    assertTrue(apiResponse.isSuccess());

    // Extract Session details
    CheckoutSessionDTO sessionDTO = objectMapper.convertValue(apiResponse.getData(), CheckoutSessionDTO.class);
    UUID paymentSessionId = sessionDTO.getPaymentSessionId();
    assertNotNull(paymentSessionId);
    assertEquals(customer.getId(), sessionDTO.getCustomerId());
    assertEquals(event.getId(), sessionDTO.getEventId());

    // Verify in Redis container: Both seats are held by this session
    List<UUID> heldSeatIds = seatHoldRedisService.getHeldSeatIds(event.getId());
    assertEquals(2, heldSeatIds.size());
    assertTrue(heldSeatIds.contains(seat1.getId()));
    assertTrue(heldSeatIds.contains(seat2.getId()));

    // --- STEP 2: Confirm Payment - Create Order, Payment, Tickets & Release Redis holds ---
    OrderResponseDTO orderResponse = customerBookingService.confirmPaymentSessionDev(paymentSessionId, customer.getId());
    assertNotNull(orderResponse);
    UUID orderId = orderResponse.getOrderId();
    assertEquals(OrderStatus.PAID, orderResponse.getStatus());
    assertEquals(new BigDecimal("2400000.00"), orderResponse.getTotalAmount()); // 1,200,000 * 2

    // Verify in PostgreSQL container via Repositories
    Order savedOrder = orderRepository.findById(orderId).orElse(null);
    assertNotNull(savedOrder);
    assertEquals(OrderStatus.PAID, savedOrder.getStatus());
    assertEquals(customer.getId(), savedOrder.getCustomerId());

    Payment savedPayment = paymentRepository.findByOrderId(orderId).orElse(null);
    assertNotNull(savedPayment);
    assertEquals(PaymentStatus.CONFIRMED, savedPayment.getStatus());
    assertEquals(new BigDecimal("2400000.00"), savedPayment.getAmount());

    List<Ticket> savedTickets = ticketRepository.findByOrderId(orderId);
    assertEquals(2, savedTickets.size());
    for (Ticket ticket : savedTickets) {
      assertEquals(TicketStatus.UNUSED, ticket.getStatus());
      assertEquals(ticketClass.getId(), ticket.getTicketClassId());
    }

    // Verify seat status updated to SOLD in Database
    Seat updatedSeat1 = seatRepository.findById(seat1.getId()).orElse(null);
    assertNotNull(updatedSeat1);
    assertEquals(SeatStatus.SOLD, updatedSeat1.getStatus());

    Seat updatedSeat2 = seatRepository.findById(seat2.getId()).orElse(null);
    assertNotNull(updatedSeat2);
    assertEquals(SeatStatus.SOLD, updatedSeat2.getStatus());

    // Verify Redis holds are successfully released
    List<UUID> postHoldSeatIds = seatHoldRedisService.getHeldSeatIds(event.getId());
    assertTrue(postHoldSeatIds.isEmpty(), "Redis seat holds must be cleared after transaction confirmation");

    // --- STEP 3: Verification of Asynchronous Mail Flow via Kafka ---
    // When confirmPaymentSessionDev executes, it fires a BookingPaidEvent into cp-kafka.
    // The Kafka consumer (BookingPaidConsumer) listens to "booking.paid", gets the event, 
    // and invokes TicketMailService to deliver the ticket email asynchronously.
    boolean emailSent = false;
    for (int i = 0; i < 40; i++) {
      Thread.sleep(250);
      try {
        verify(javaMailSender, atLeastOnce()).send(any(MimeMessage.class));
        emailSent = true;
        break;
      } catch (Throwable ignored) {
        // Retry until async listener processes the message
      }
    }

    assertTrue(emailSent, "Ticket email should be sent asynchronously via Kafka event consumer");
  }
}
