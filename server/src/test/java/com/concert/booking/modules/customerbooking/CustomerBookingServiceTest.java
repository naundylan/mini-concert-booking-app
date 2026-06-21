package com.concert.booking.modules.customerbooking;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.concert.booking.common.constants.BankTransferProperties;
import com.concert.booking.common.constants.CheckoutProperties;
import com.concert.booking.common.constants.SePayProperties;
import com.concert.booking.common.constants.VietQrProperties;
import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.customerbooking.dto.CheckoutSessionDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerSelectedSeatDTO;
import com.concert.booking.modules.customerbooking.redis.CheckoutSessionRedisService;
import com.concert.booking.modules.customerbooking.sepay.SePayWebhookVerifier;
import com.concert.booking.modules.customerbooking.socket.SeatSocketService;
import com.concert.booking.modules.customerbooking.vietqr.VietQrService;
import com.concert.booking.modules.event.EventRepository;
import com.concert.booking.modules.order.OrderRepository;
import com.concert.booking.modules.order.PaymentRepository;
import com.concert.booking.modules.order.TicketRepository;
import com.concert.booking.modules.seat.SeatHoldService;
import com.concert.booking.modules.seat.SeatRepository;
import com.concert.booking.modules.seat.redis.SeatHoldRedisService;
import com.concert.booking.modules.ticket.TicketClassRepository;
import com.concert.booking.modules.ticketmail.TicketDeliveryService;
import java.math.BigDecimal;
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
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class CustomerBookingServiceTest {

  @Mock EventRepository eventRepository;
  @Mock SeatRepository seatRepository;
  @Mock TicketClassRepository ticketClassRepository;
  @Mock OrderRepository orderRepository;
  @Mock PaymentRepository paymentRepository;
  @Mock TicketRepository ticketRepository;
  @Mock SeatHoldService seatHoldService;
  @Mock CheckoutSessionRedisService checkoutSessionRedisService;
  @Mock SeatHoldRedisService seatHoldRedisService;
  @Mock SeatSocketService seatSocketService;
  @Mock BankTransferProperties bankTransferProperties;
  @Mock VietQrProperties vietQrProperties;
  @Mock SePayProperties sePayProperties;
  @Mock CheckoutProperties checkoutProperties;
  @Mock VietQrService vietQrService;
  @Mock SePayWebhookVerifier sePayWebhookVerifier;
  @Mock TicketDeliveryService ticketDeliveryService;

  @InjectMocks CustomerBookingServiceImpl customerBookingService;

  private UUID paymentSessionId;
  private UUID customerId;
  private UUID eventId;
  private CheckoutSessionDTO checkoutSession;

  @BeforeEach
  void setUp() {
    paymentSessionId = UUID.randomUUID();
    customerId = UUID.randomUUID();
    eventId = UUID.randomUUID();

    CustomerSelectedSeatDTO seat =
        CustomerSelectedSeatDTO.builder()
            .id(UUID.randomUUID())
            .label("A1")
            .price(new BigDecimal("500000"))
            .ticketClassName("VIP")
            .build();

    checkoutSession =
        CheckoutSessionDTO.builder()
            .paymentSessionId(paymentSessionId)
            .customerId(customerId)
            .eventId(eventId)
            .totalAmount(new BigDecimal("500000"))
            .expiresAt(Instant.now().plusSeconds(600)) // 10 mins in future
            .selectedSeats(List.of(seat))
            .build();
  }

  @Test
  void releaseCheckout_success_shouldReleaseSeatsAndDeleteSessions() {
    // Arrange
    when(checkoutSessionRedisService.findById(paymentSessionId))
        .thenReturn(Optional.of(checkoutSession));

    // Act
    customerBookingService.releaseCheckout(paymentSessionId, customerId);

    // Assert
    List<UUID> expectedSeatIds = List.of(checkoutSession.getSelectedSeats().get(0).getId());
    verify(seatHoldRedisService, times(1)).releaseSeats(eventId, expectedSeatIds);
    verify(checkoutSessionRedisService, times(1)).delete(paymentSessionId);
    verify(checkoutSessionRedisService, times(1))
        .deleteActiveSession(eventId, customerId, paymentSessionId);
    verify(seatSocketService, times(1)).emitSeatReleased(eventId, expectedSeatIds);
  }

  @Test
  void releaseCheckout_sessionExpired_shouldThrowException() {
    // Arrange: Session exists but expired
    checkoutSession =
        CheckoutSessionDTO.builder()
            .paymentSessionId(paymentSessionId)
            .customerId(customerId)
            .eventId(eventId)
            .expiresAt(Instant.now().minusSeconds(10)) // already expired
            .build();
    when(checkoutSessionRedisService.findById(paymentSessionId))
        .thenReturn(Optional.of(checkoutSession));

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> {
              customerBookingService.releaseCheckout(paymentSessionId, customerId);
            });

    assertEquals(HttpStatus.GONE, exception.getStatusCode());
    assertEquals("Phien thanh toan da het han", exception.getMessage());
    verify(checkoutSessionRedisService, times(1)).delete(paymentSessionId);
    verifyNoInteractions(seatHoldRedisService);
  }

  @Test
  void releaseCheckout_wrongCustomer_shouldThrowForbidden() {
    // Arrange: Session belongs to a different customer
    UUID otherCustomer = UUID.randomUUID();
    when(checkoutSessionRedisService.findById(paymentSessionId))
        .thenReturn(Optional.of(checkoutSession));

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> {
              customerBookingService.releaseCheckout(paymentSessionId, otherCustomer);
            });

    assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    assertEquals("Ban khong co quyen truy cap phien thanh toan nay", exception.getMessage());
    verifyNoMoreInteractions(seatHoldRedisService);
  }
}
