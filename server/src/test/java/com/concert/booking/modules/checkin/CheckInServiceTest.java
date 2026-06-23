package com.concert.booking.modules.checkin;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.checkin.dto.*;
import com.concert.booking.modules.event.Event;
import com.concert.booking.modules.event.EventRepository;
import com.concert.booking.modules.event.enums.EventStatus;
import com.concert.booking.modules.order.Order;
import com.concert.booking.modules.order.OrderRepository;
import com.concert.booking.modules.order.Ticket;
import com.concert.booking.modules.order.TicketRepository;
import com.concert.booking.modules.order.enums.OrderStatus;
import com.concert.booking.modules.order.enums.TicketStatus;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.TicketClassRepository;
import com.concert.booking.modules.user.User;
import com.concert.booking.modules.user.UserRepository;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class CheckInServiceTest {

  @Mock EventRepository eventRepository;
  @Mock OrderRepository orderRepository;
  @Mock TicketRepository ticketRepository;
  @Mock TicketClassRepository ticketClassRepository;
  @Mock UserRepository userRepository;

  @InjectMocks CheckInServiceImpl checkInService;

  private UUID eventId;
  private UUID ticketId;
  private UUID orderId;
  private UUID customerId;
  private UUID staffId;
  private UUID ticketClassId;

  private Event activeEvent;
  private Order paidOrder;
  private Ticket unusedTicket;
  private TicketClass ticketClass;
  private User customer;
  private User staff;

  @BeforeEach
  void setUp() {
    eventId = UUID.randomUUID();
    ticketId = UUID.randomUUID();
    orderId = UUID.randomUUID();
    customerId = UUID.randomUUID();
    staffId = UUID.randomUUID();
    ticketClassId = UUID.randomUUID();

    activeEvent =
        Event.builder()
            .id(eventId)
            .name("Symphony Concert")
            .status(EventStatus.ONSALE)
            .startTime(Timestamp.from(Instant.now().minusSeconds(3600)))
            .endTime(Timestamp.from(Instant.now().plusSeconds(7200)))
            .build();

    paidOrder =
        Order.builder()
            .id(orderId)
            .orderCode("ORD-12345")
            .eventId(eventId)
            .customerId(customerId)
            .status(OrderStatus.PAID)
            .totalAmount(new BigDecimal("100000"))
            .build();

    unusedTicket =
        Ticket.builder()
            .id(ticketId)
            .orderId(orderId)
            .ticketClassId(ticketClassId)
            .seatLabel("A1")
            .price(new BigDecimal("100000"))
            .status(TicketStatus.UNUSED)
            .build();

    ticketClass =
        TicketClass.builder()
            .id(ticketClassId)
            .eventId(eventId)
            .name("VIP")
            .colorCode("#FF0000")
            .price(new BigDecimal("100000"))
            .build();

    customer =
        User.builder()
            .id(customerId)
            .fullName("Nguyen Van A")
            .phone("0987654321")
            .build();

    staff =
        User.builder()
            .id(staffId)
            .fullName("Staff Checkin")
            .build();
  }

  @Test
  void getCheckInEvents_success() {
    // Arrange
    when(eventRepository.findCheckInCandidates(eq(List.of(EventStatus.ONSALE, EventStatus.ENDED)), any(Timestamp.class)))
        .thenReturn(List.of(activeEvent));

    // Act
    List<CheckInEventDTO> result = checkInService.getCheckInEvents();

    // Assert
    assertNotNull(result);
    assertEquals(1, result.size());
    assertEquals(eventId, result.get(0).getId());
    assertEquals("Symphony Concert", result.get(0).getName());
  }

  @Test
  void search_success() {
    // Arrange
    when(eventRepository.findById(eventId)).thenReturn(Optional.of(activeEvent));
    when(orderRepository.searchCheckInOrders(eventId, "Nguyen")).thenReturn(List.of(paidOrder));
    when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
    when(ticketRepository.findByOrderId(orderId)).thenReturn(List.of(unusedTicket));
    when(ticketClassRepository.findByEventId(eventId)).thenReturn(List.of(ticketClass));

    // Act
    List<CheckInOrderDTO> result = checkInService.search(eventId, "Nguyen");

    // Assert
    assertNotNull(result);
    assertEquals(1, result.size());
    assertEquals(orderId, result.get(0).getOrderId());
    assertEquals("Nguyen Van A", result.get(0).getCustomerName());
    assertEquals(1, result.get(0).getTickets().size());
  }

  @Test
  void search_blankKeyword_shouldThrowException() {
    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> checkInService.search(eventId, "   "));
    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    assertEquals("Từ khóa tìm kiếm không được để trống", exception.getMessage());
  }

  @Test
  void search_nullEventId_shouldThrowException() {
    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> checkInService.search(null, "Nguyen"));
    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
  }

  @Test
  void checkInTicket_success() {
    // Arrange
    when(eventRepository.findById(eventId)).thenReturn(Optional.of(activeEvent));
    when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(unusedTicket));
    when(orderRepository.findById(orderId)).thenReturn(Optional.of(paidOrder));
    when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
    when(ticketClassRepository.findById(ticketClassId)).thenReturn(Optional.of(ticketClass));
    when(userRepository.findById(staffId)).thenReturn(Optional.of(staff));
    when(ticketRepository.saveAndFlush(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

    // Act
    CheckInResponseDTO response = checkInService.checkInTicket(ticketId, eventId, staffId);

    // Assert
    assertNotNull(response);
    assertEquals(CheckInResultStatus.ACCEPTED, response.getResult());
    assertEquals("Cho vào cổng", response.getMessage());
    assertEquals(TicketStatus.USED, unusedTicket.getStatus());
    assertNotNull(unusedTicket.getCheckInTime());
    assertEquals(staffId, unusedTicket.getCheckInBy());
  }

  @Test
  void checkInTicket_doubleCheckIn_shouldReturnAlreadyUsed() {
    // Arrange
    unusedTicket.setStatus(TicketStatus.USED);
    unusedTicket.setCheckInTime(Timestamp.from(Instant.now().minusSeconds(100)));
    unusedTicket.setCheckInBy(staffId);

    when(eventRepository.findById(eventId)).thenReturn(Optional.of(activeEvent));
    when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(unusedTicket));
    when(orderRepository.findById(orderId)).thenReturn(Optional.of(paidOrder));
    when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
    when(ticketClassRepository.findById(ticketClassId)).thenReturn(Optional.of(ticketClass));
    when(userRepository.findById(staffId)).thenReturn(Optional.of(staff));

    // Act
    CheckInResponseDTO response = checkInService.checkInTicket(ticketId, eventId, staffId);

    // Assert
    assertNotNull(response);
    assertEquals(CheckInResultStatus.ALREADY_USED, response.getResult());
    assertEquals("Vé đã sử dụng", response.getMessage());
    verify(ticketRepository, never()).saveAndFlush(any());
  }

  @Test
  void checkInTicket_orderNotPaid_shouldReturnInvalid() {
    // Arrange
    paidOrder.setStatus(OrderStatus.CANCELED);

    when(eventRepository.findById(eventId)).thenReturn(Optional.of(activeEvent));
    when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(unusedTicket));
    when(orderRepository.findById(orderId)).thenReturn(Optional.of(paidOrder));
    when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
    when(ticketClassRepository.findById(ticketClassId)).thenReturn(Optional.of(ticketClass));

    // Act
    CheckInResponseDTO response = checkInService.checkInTicket(ticketId, eventId, staffId);

    // Assert
    assertNotNull(response);
    assertEquals(CheckInResultStatus.INVALID, response.getResult());
    assertEquals("Đơn hàng chưa hoàn tất thanh toán", response.getMessage());
  }

  @Test
  void checkInTicket_ticketCanceled_shouldReturnCanceled() {
    // Arrange
    unusedTicket.setStatus(TicketStatus.CANCELED);

    when(eventRepository.findById(eventId)).thenReturn(Optional.of(activeEvent));
    when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(unusedTicket));
    when(orderRepository.findById(orderId)).thenReturn(Optional.of(paidOrder));
    when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
    when(ticketClassRepository.findById(ticketClassId)).thenReturn(Optional.of(ticketClass));

    // Act
    CheckInResponseDTO response = checkInService.checkInTicket(ticketId, eventId, staffId);

    // Assert
    assertNotNull(response);
    assertEquals(CheckInResultStatus.CANCELED, response.getResult());
    assertEquals("Vé đã bị hủy", response.getMessage());
  }

  @Test
  void checkInTicket_ticketNotBelongToEvent_shouldThrowException() {
    // Arrange
    paidOrder.setEventId(UUID.randomUUID()); // mismatch eventId

    when(eventRepository.findById(eventId)).thenReturn(Optional.of(activeEvent));
    when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(unusedTicket));
    when(orderRepository.findById(orderId)).thenReturn(Optional.of(paidOrder));
    when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> checkInService.checkInTicket(ticketId, eventId, staffId));
    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    assertEquals("Vé không thuộc sự kiện này", exception.getMessage());
  }

  @Test
  void checkInTicket_optimisticLockConflict_alreadyUsed() {
    // Arrange
    Ticket latestTicket = Ticket.builder()
        .id(ticketId)
        .orderId(orderId)
        .ticketClassId(ticketClassId)
        .seatLabel("A1")
        .price(new BigDecimal("100000"))
        .status(TicketStatus.USED)
        .checkInBy(staffId) // Set this so it triggers the staff user find mock
        .build();

    when(eventRepository.findById(eventId)).thenReturn(Optional.of(activeEvent));
    when(ticketRepository.findById(ticketId))
        .thenReturn(Optional.of(unusedTicket)) // First call
        .thenReturn(Optional.of(latestTicket)); // Second call (conflict resolution)
    when(orderRepository.findById(orderId)).thenReturn(Optional.of(paidOrder));
    when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
    when(ticketClassRepository.findById(ticketClassId)).thenReturn(Optional.of(ticketClass));
    when(userRepository.findById(staffId)).thenReturn(Optional.of(staff));
    
    // Giả lập saveAndFlush ném OptimisticLockingFailureException
    when(ticketRepository.saveAndFlush(any(Ticket.class)))
        .thenThrow(new OptimisticLockingFailureException("Conflict"));

    // Act
    CheckInResponseDTO response = checkInService.checkInTicket(ticketId, eventId, staffId);

    // Assert
    assertNotNull(response);
    assertEquals(CheckInResultStatus.ALREADY_USED, response.getResult());
    assertEquals("Vé đã sử dụng", response.getMessage());
  }

  @Test
  void checkInTicket_optimisticLockConflict_throwConflict() {
    // Arrange
    Ticket latestTicket = Ticket.builder()
        .id(ticketId)
        .orderId(orderId)
        .ticketClassId(ticketClassId)
        .seatLabel("A1")
        .price(new BigDecimal("100000"))
        .status(TicketStatus.UNUSED)
        .build();

    when(eventRepository.findById(eventId)).thenReturn(Optional.of(activeEvent));
    when(ticketRepository.findById(ticketId))
        .thenReturn(Optional.of(unusedTicket)) // First call
        .thenReturn(Optional.of(latestTicket)); // Second call (conflict resolution)
    when(orderRepository.findById(orderId)).thenReturn(Optional.of(paidOrder));
    when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
    
    when(ticketRepository.saveAndFlush(any(Ticket.class)))
        .thenThrow(new OptimisticLockingFailureException("Conflict"));

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> checkInService.checkInTicket(ticketId, eventId, staffId));
    assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
    assertEquals("Vé vừa được cập nhật, vui lòng quét lại", exception.getMessage());
  }
}
