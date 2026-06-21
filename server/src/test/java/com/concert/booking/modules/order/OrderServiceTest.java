package com.concert.booking.modules.order;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.event.Event;
import com.concert.booking.modules.event.EventRepository;
import com.concert.booking.modules.event.enums.EventStatus;
import com.concert.booking.modules.order.dto.CustomerLookupDTO;
import com.concert.booking.modules.order.dto.OrderCreateDTO;
import com.concert.booking.modules.order.dto.OrderResponseDTO;
import com.concert.booking.modules.order.dto.PaymentCreateDTO;
import com.concert.booking.modules.order.enums.OrderStatus;
import com.concert.booking.modules.order.enums.PaymentMethod;
import com.concert.booking.modules.order.enums.PaymentStatus;
import com.concert.booking.modules.order.enums.TicketStatus;
import com.concert.booking.modules.seat.Seat;
import com.concert.booking.modules.seat.SeatHoldService;
import com.concert.booking.modules.seat.SeatRepository;
import com.concert.booking.modules.seat.enums.SeatStatus;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.TicketClassRepository;
import com.concert.booking.modules.ticketmail.TicketDeliveryService;
import com.concert.booking.modules.user.User;
import com.concert.booking.modules.user.UserRepository;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

  @Mock OrderRepository orderRepository;
  @Mock PaymentRepository paymentRepository;
  @Mock TicketRepository ticketRepository;
  @Mock EventRepository eventRepository;
  @Mock SeatRepository seatRepository;
  @Mock SeatHoldService seatHoldService;
  @Mock TicketClassRepository ticketClassRepository;
  @Mock UserRepository userRepository;
  @Mock TicketDeliveryService ticketDeliveryService;

  @InjectMocks OrderServiceImpl orderService;

  @Test
  void lookupCustomerByPhone_success_shouldReturnFoundCustomer() {
    // Arrange
    String phone = "0987654321";
    UUID customerId = UUID.randomUUID();
    User user =
        User.builder()
            .id(customerId)
            .phone(phone)
            .fullName("Nguyen Van A")
            .email("a@gmail.com")
            .onlineVerified(true)
            .build();

    when(userRepository.findByPhone(phone)).thenReturn(Optional.of(user));

    // Act
    CustomerLookupDTO result = orderService.lookupCustomerByPhone(phone);

    // Assert
    assertNotNull(result);
    assertTrue(result.isFound());
    assertEquals(customerId, result.getCustomerId());
    assertEquals(phone, result.getPhone());
    assertEquals("Nguyen Van A", result.getFullName());
    assertEquals("a@gmail.com", result.getEmail());
    assertTrue(result.getOnlineVerified());
    verify(userRepository, times(1)).findByPhone(phone);
  }

  @Test
  void lookupCustomerByPhone_notFound_shouldReturnNotFoundCustomer() {
    // Arrange
    String phone = " 0987654321 "; // Includes whitespace to test trimming
    String trimmedPhone = "0987654321";
    when(userRepository.findByPhone(trimmedPhone)).thenReturn(Optional.empty());

    // Act
    CustomerLookupDTO result = orderService.lookupCustomerByPhone(phone);

    // Assert
    assertNotNull(result);
    assertFalse(result.isFound());
    assertNull(result.getCustomerId());
    assertEquals(trimmedPhone, result.getPhone());
    verify(userRepository, times(1)).findByPhone(trimmedPhone);
  }

  @Test
  void lookupCustomerByPhone_nullOrBlankPhone_shouldThrowBadRequest() {
    // Act & Assert 1: Null phone
    AppException exception1 =
        assertThrows(
            AppException.class,
            () -> {
              orderService.lookupCustomerByPhone(null);
            });
    assertEquals(HttpStatus.BAD_REQUEST, exception1.getStatusCode());
    assertEquals("Số điện thoại không được để trống", exception1.getMessage());

    // Act & Assert 2: Blank phone
    AppException exception2 =
        assertThrows(
            AppException.class,
            () -> {
              orderService.lookupCustomerByPhone("   ");
            });
    assertEquals(HttpStatus.BAD_REQUEST, exception2.getStatusCode());
    assertEquals("Số điện thoại không được để trống", exception2.getMessage());

    verifyNoInteractions(userRepository);
  }

  @Test
  void createOrder_success_shouldReturnOrderResponse() {
    // Arrange
    UUID staffId = UUID.randomUUID();
    UUID eventId = UUID.randomUUID();
    UUID seatId = UUID.randomUUID();
    List<UUID> seatIds = List.of(seatId);

    OrderCreateDTO request =
        OrderCreateDTO.builder()
            .eventId(eventId)
            .phone("0123456789")
            .fullName("Khach Hang A")
            .email("khach@gmail.com")
            .seatIds(seatIds)
            .payment(
                PaymentCreateDTO.builder()
                    .paymentMethod(PaymentMethod.CASH)
                    .amountReceived(new BigDecimal("500000"))
                    .build())
            .build();

    Event event =
        Event.builder()
            .id(eventId)
            .name("POS Concert")
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
            .name("VIP")
            .price(new BigDecimal("500000"))
            .build();

    User customer = User.builder().id(UUID.randomUUID()).phone("0123456789").build();

    Order order =
        Order.builder()
            .id(UUID.randomUUID())
            .orderCode("O8888888")
            .eventId(eventId)
            .customerId(customer.getId())
            .totalAmount(new BigDecimal("500000"))
            .status(OrderStatus.PAID)
            .build();

    Payment payment =
        Payment.builder()
            .id(UUID.randomUUID())
            .orderId(order.getId())
            .amount(new BigDecimal("500000"))
            .amountReceived(new BigDecimal("500000"))
            .paymentMethod(PaymentMethod.CASH)
            .status(PaymentStatus.CONFIRMED)
            .build();

    when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
    when(seatHoldService.lockAvailableSeats(eventId, seatIds)).thenReturn(List.of(seat));
    when(ticketClassRepository.findByEventId(eventId)).thenReturn(List.of(ticketClass));
    when(userRepository.findByPhone("0123456789")).thenReturn(Optional.of(customer));
    when(userRepository.save(any(User.class))).thenReturn(customer);
    when(orderRepository.save(any(Order.class))).thenReturn(order);
    when(paymentRepository.save(any(Payment.class))).thenReturn(payment);

    // Act
    OrderResponseDTO result = orderService.createOrder(request, staffId);

    // Assert
    assertNotNull(result);
    assertEquals("O8888888", result.getOrderCode());
    verify(seatHoldService, times(1)).confirmSold(List.of(seat), staffId);
    verify(ticketRepository, times(1)).saveAll(anyList());
    verify(ticketDeliveryService, times(1)).deliverTicketsAfterCommit(any());
  }

  @Test
  void createOrder_vietQrUnsupported_shouldThrowBadRequest() {
    // Arrange
    UUID staffId = UUID.randomUUID();
    OrderCreateDTO request =
        OrderCreateDTO.builder()
            .payment(
                PaymentCreateDTO.builder()
                    .paymentMethod(PaymentMethod.VIETQR) // VIETQR is unsupported on POS counter
                    .build())
            .build();

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> {
              orderService.createOrder(request, staffId);
            });

    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    assertEquals("Phương thức thanh toán này chưa hỗ trợ tạo đơn POS", exception.getMessage());
  }

  @Test
  void createOrder_insufficientPayment_shouldThrowBadRequest() {
    // Arrange
    UUID staffId = UUID.randomUUID();
    UUID eventId = UUID.randomUUID();
    UUID seatId = UUID.randomUUID();
    List<UUID> seatIds = List.of(seatId);

    OrderCreateDTO request =
        OrderCreateDTO.builder()
            .eventId(eventId)
            .seatIds(seatIds)
            .payment(
                PaymentCreateDTO.builder()
                    .paymentMethod(PaymentMethod.CASH)
                    .amountReceived(new BigDecimal("300000")) // Paid only 300k
                    .build())
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
            .price(new BigDecimal("500000")) // Ticket is 500k
            .build();

    when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
    when(seatHoldService.lockAvailableSeats(eventId, seatIds)).thenReturn(List.of(seat));
    when(ticketClassRepository.findByEventId(eventId)).thenReturn(List.of(ticketClass));

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> {
              orderService.createOrder(request, staffId);
            });

    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    assertEquals("Số tiền thực nhận chưa đủ để xác nhận thanh toán", exception.getMessage());
  }

  @Test
  void createOrder_nullStaffId_shouldThrowUnauthorized() {
    // Arrange: staffId is null
    OrderCreateDTO request = OrderCreateDTO.builder().build();

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> {
              orderService.createOrder(request, null);
            });

    assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
    assertEquals("Không xác định được nhân viên bán vé", exception.getMessage());
  }
}
