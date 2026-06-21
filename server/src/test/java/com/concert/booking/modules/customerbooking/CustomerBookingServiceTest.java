package com.concert.booking.modules.customerbooking;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.concert.booking.common.constants.BankTransferProperties;
import com.concert.booking.common.constants.CheckoutProperties;
import com.concert.booking.common.constants.SePayProperties;
import com.concert.booking.common.constants.VietQrProperties;
import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.customerbooking.dto.CheckoutRequestDTO;
import com.concert.booking.modules.customerbooking.dto.CheckoutSessionDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerSelectedSeatDTO;
import com.concert.booking.modules.customerbooking.redis.CheckoutSessionRedisService;
import com.concert.booking.modules.customerbooking.sepay.SePayWebhookVerifier;
import com.concert.booking.modules.customerbooking.socket.SeatSocketService;
import com.concert.booking.modules.customerbooking.vietqr.VietQrService;
import com.concert.booking.modules.event.Event;
import com.concert.booking.modules.event.EventRepository;
import com.concert.booking.modules.event.enums.EventStatus;
import com.concert.booking.modules.order.OrderRepository;
import com.concert.booking.modules.order.PaymentRepository;
import com.concert.booking.modules.order.TicketRepository;
import com.concert.booking.modules.order.enums.PaymentMethod;
import com.concert.booking.modules.seat.Seat;
import com.concert.booking.modules.seat.SeatHoldService;
import com.concert.booking.modules.seat.SeatRepository;
import com.concert.booking.modules.seat.enums.SeatStatus;
import com.concert.booking.modules.seat.redis.SeatHoldRedisService;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.TicketClassRepository;
import com.concert.booking.modules.ticketmail.TicketDeliveryService;
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

  @Test
  void checkout_success_shouldReturnCheckoutSession() {
    // Arrange
    UUID eventId = this.eventId;
    UUID customerId = this.customerId;
    UUID seatId = UUID.randomUUID();
    List<UUID> seatIds = List.of(seatId);

    CheckoutRequestDTO checkoutRequest =
        CheckoutRequestDTO.builder()
            .eventId(eventId)
            .seatIds(seatIds)
            .paymentMethod(PaymentMethod.BANK_TRANSFER)
            .build();

    Event event =
        Event.builder()
            .id(eventId)
            .status(EventStatus.ONSALE)
            .startTime(Timestamp.from(Instant.now().plusSeconds(3600)))
            .build();

    Seat seat =
        Seat.builder()
            .id(seatId)
            .eventId(eventId)
            .ticketClassId(UUID.randomUUID())
            .status(SeatStatus.AVAILABLE)
            .build();

    TicketClass ticketClass =
        TicketClass.builder()
            .id(seat.getTicketClassId())
            .name("Standard")
            .price(new BigDecimal("300000"))
            .build();

    when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
    when(checkoutSessionRedisService.findActiveSessions(eventId, customerId)).thenReturn(List.of());
    when(seatHoldRedisService.hasAnyHeldSeat(eventId, seatIds)).thenReturn(false);
    when(seatHoldService.lockAvailableSeats(eventId, seatIds)).thenReturn(List.of(seat));
    when(ticketClassRepository.findByEventId(eventId)).thenReturn(List.of(ticketClass));
    when(checkoutProperties.getHoldTtlMinutes()).thenReturn(10);
    when(bankTransferProperties.getAccountNumber()).thenReturn("123456");
    when(bankTransferProperties.getAccountName()).thenReturn("Test Account");

    // Act
    CheckoutSessionDTO result = customerBookingService.checkout(checkoutRequest, customerId);

    // Assert
    assertNotNull(result);
    assertEquals(customerId, result.getCustomerId());
    assertEquals(eventId, result.getEventId());
    assertEquals(new BigDecimal("300000"), result.getTotalAmount());
    verify(seatHoldRedisService, times(1))
        .holdSeats(eq(eventId), any(UUID.class), eq(seatIds), any());
    verify(checkoutSessionRedisService, times(1)).save(eq(result), any());
    verify(checkoutSessionRedisService, times(1))
        .addActiveSession(eq(eventId), eq(customerId), any(UUID.class));
    verify(seatSocketService, times(1)).emitSeatHeld(eq(eventId), eq(seatIds), any());
  }

  @Test
  void checkout_unsupportedPaymentMethod_shouldThrowException() {
    // Arrange
    CheckoutRequestDTO checkoutRequest =
        CheckoutRequestDTO.builder()
            .paymentMethod(null) // Not BANK_TRANSFER or VIETQR
            .build();

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> {
              customerBookingService.checkout(checkoutRequest, customerId);
            });

    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    assertEquals("Phuong thuc thanh toan chua duoc ho tro", exception.getMessage());
  }

  @Test
  void checkout_tooManyActiveSessions_shouldThrowException() {
    // Arrange
    UUID seatId = UUID.randomUUID();
    List<UUID> seatIds = List.of(seatId);
    CheckoutRequestDTO checkoutRequest =
        CheckoutRequestDTO.builder()
            .eventId(eventId)
            .seatIds(seatIds)
            .paymentMethod(PaymentMethod.BANK_TRANSFER)
            .build();

    Event event =
        Event.builder()
            .id(eventId)
            .status(EventStatus.ONSALE)
            .startTime(Timestamp.from(Instant.now().plusSeconds(3600)))
            .build();

    // Mock 3 active sessions
    List<CheckoutSessionDTO> activeSessions =
        List.of(
            CheckoutSessionDTO.builder().selectedSeats(List.of()).build(),
            CheckoutSessionDTO.builder().selectedSeats(List.of()).build(),
            CheckoutSessionDTO.builder().selectedSeats(List.of()).build());

    when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
    when(checkoutSessionRedisService.findActiveSessions(eventId, customerId))
        .thenReturn(activeSessions);

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> {
              customerBookingService.checkout(checkoutRequest, customerId);
            });

    assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
    assertEquals(
        "Ban chi co toi da 3 phien thanh toan dang giu ghe cho su kien nay",
        exception.getMessage());
  }
}
