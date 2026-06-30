package com.concert.booking.modules.ticketmail;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

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
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TicketMailServiceTest {

  @Mock TicketMailAsyncService ticketMailAsyncService;
  @Mock TicketMailProperties ticketMailProperties;
  @Mock OrderRepository orderRepository;
  @Mock TicketRepository ticketRepository;
  @Mock EventRepository eventRepository;
  @Mock TicketClassRepository ticketClassRepository;
  @Mock UserRepository userRepository;

  @InjectMocks TicketMailService ticketMailService;

  private UUID orderId;
  private UUID customerId;
  private UUID eventId;
  private UUID ticketClassId;
  private UUID ticketId;

  private Order order;
  private User customer;
  private Event event;
  private Ticket ticket;
  private TicketClass ticketClass;

  @BeforeEach
  void setUp() {
    orderId = UUID.randomUUID();
    customerId = UUID.randomUUID();
    eventId = UUID.randomUUID();
    ticketClassId = UUID.randomUUID();
    ticketId = UUID.randomUUID();

    order =
        Order.builder()
            .id(orderId)
            .customerId(customerId)
            .eventId(eventId)
            .orderCode("O1234567")
            .totalAmount(new BigDecimal("500000"))
            .status(OrderStatus.PAID)
            .emailStatus(EmailStatus.UNSENT) // Starts as UNSENT
            .build();

    customer =
        User.builder()
            .id(customerId)
            .fullName("Nguyen Van A")
            .email("test@example.com")
            .phone("0123456789")
            .build();

    event =
        Event.builder()
            .id(eventId)
            .name("Concert Mini")
            .location("Ha Noi")
            .startTime(Timestamp.from(Instant.now().plusSeconds(86400)))
            .build();

    ticket =
        Ticket.builder()
            .id(ticketId)
            .orderId(orderId)
            .seatId(UUID.randomUUID())
            .ticketClassId(ticketClassId)
            .seatLabel("A1")
            .price(new BigDecimal("500000"))
            .build();

    ticketClass =
        TicketClass.builder()
            .id(ticketClassId)
            .eventId(eventId)
            .name("VIP")
            .price(new BigDecimal("500000"))
            .colorCode("#FF0000")
            .build();
  }

  @Test
  void sendTicketsForOrder_disabled_shouldSkip() {
    when(ticketMailProperties.isEnabled()).thenReturn(false);

    ticketMailService.sendTicketsForOrder(orderId);

    verifyNoInteractions(orderRepository);
    verifyNoInteractions(ticketMailAsyncService);
  }

  @Test
  void sendTicketsForOrder_orderNotPaid_shouldSkip() {
    when(ticketMailProperties.isEnabled()).thenReturn(true);
    order.setStatus(OrderStatus.CANCELED);
    when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

    ticketMailService.sendTicketsForOrder(orderId);

    verify(orderRepository, never()).save(any());
    verifyNoInteractions(ticketMailAsyncService);
  }

  @Test
  void sendTicketsForOrder_alreadySent_shouldSkip() {
    when(ticketMailProperties.isEnabled()).thenReturn(true);
    order.setEmailStatus(EmailStatus.SENT);
    when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

    ticketMailService.sendTicketsForOrder(orderId);

    verify(orderRepository, never()).save(any());
    verifyNoInteractions(ticketMailAsyncService);
  }

  @Test
  void sendTicketsForOrder_alreadyPending_shouldSkip() {
    when(ticketMailProperties.isEnabled()).thenReturn(true);
    order.setEmailStatus(EmailStatus.PENDING);
    when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

    ticketMailService.sendTicketsForOrder(orderId);

    verify(orderRepository, never()).save(any());
    verifyNoInteractions(ticketMailAsyncService);
  }

  @Test
  void sendTicketsForOrder_success_shouldSavePendingAndCallAsyncService() {
    when(ticketMailProperties.isEnabled()).thenReturn(true);
    when(ticketMailProperties.getSubject()).thenReturn("Ve cua ban");

    when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
    when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
    when(ticketRepository.findByOrderId(orderId)).thenReturn(List.of(ticket));
    when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
    when(ticketClassRepository.findByEventId(eventId)).thenReturn(List.of(ticketClass));

    ticketMailService.sendTicketsForOrder(orderId);

    assertEquals(EmailStatus.PENDING, order.getEmailStatus());
    verify(orderRepository, times(1)).save(order);
    verify(ticketMailAsyncService, times(1)).sendEmailAsync(any(TicketMailDto.class));
  }
}
