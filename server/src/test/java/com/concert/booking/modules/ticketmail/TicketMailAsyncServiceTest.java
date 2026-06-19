package com.concert.booking.modules.ticketmail;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.concert.booking.core.mail.MailService;
import com.concert.booking.modules.order.Order;
import com.concert.booking.modules.order.OrderRepository;
import com.concert.booking.modules.order.enums.EmailStatus;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TicketMailAsyncServiceTest {

  @Mock MailService mailService;
  @Mock OrderRepository orderRepository;

  @InjectMocks TicketMailAsyncService ticketMailAsyncService;

  private UUID orderId;
  private TicketMailDto mailDto;
  private Order order;

  @BeforeEach
  void setUp() {
    orderId = UUID.randomUUID();
    mailDto = new TicketMailDto(orderId, "test@example.com", "Subject", "Body");
    order = Order.builder().id(orderId).emailStatus(EmailStatus.PENDING).build();
  }

  @Test
  void sendEmailAsync_success_shouldUpdateStatusToSent() {
    when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

    ticketMailAsyncService.sendEmailAsync(mailDto);

    verify(mailService, times(1)).sendHtmlMail("test@example.com", "Subject", "Body");
    verify(orderRepository, times(1)).save(order);
    assertEquals(EmailStatus.SENT, order.getEmailStatus());
  }

  @Test
  void recover_shouldMarkFailed() {
    when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

    Exception mockException = new RuntimeException("SMTP Server down");
    ticketMailAsyncService.recover(mockException, mailDto);

    verify(orderRepository, times(1)).save(order);
    assertEquals(EmailStatus.FAILED, order.getEmailStatus());
  }
}
