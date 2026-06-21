package com.concert.booking.modules.order;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.event.EventRepository;
import com.concert.booking.modules.order.dto.CustomerLookupDTO;
import com.concert.booking.modules.seat.SeatHoldService;
import com.concert.booking.modules.seat.SeatRepository;
import com.concert.booking.modules.ticket.TicketClassRepository;
import com.concert.booking.modules.ticketmail.TicketDeliveryService;
import com.concert.booking.modules.user.User;
import com.concert.booking.modules.user.UserRepository;
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
}
