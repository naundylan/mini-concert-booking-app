package com.concert.booking.modules.admin;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.admin.dto.*;
import com.concert.booking.modules.event.Event;
import com.concert.booking.modules.event.EventRepository;
import com.concert.booking.modules.event.enums.EventStatus;
import com.concert.booking.modules.seat.Seat;
import com.concert.booking.modules.seat.SeatRepository;
import com.concert.booking.modules.seat.enums.SeatStatus;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.TicketClassRepository;
import com.concert.booking.modules.ticket.dto.TicketClassCreateDTO;
import java.math.BigDecimal;
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
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class AdminCatalogServiceTest {

  @Mock EventRepository eventRepository;
  @Mock TicketClassRepository ticketClassRepository;
  @Mock SeatRepository seatRepository;

  @InjectMocks AdminCatalogServiceImpl adminCatalogService;

  private UUID eventId;
  private UUID ticketClassId;
  private UUID seatId;
  private UUID adminId;

  private Event draftEvent;
  private Event activeEvent;
  private TicketClass ticketClass;
  private Seat availableSeat;

  @BeforeEach
  void setUp() {
    eventId = UUID.randomUUID();
    ticketClassId = UUID.randomUUID();
    seatId = UUID.randomUUID();
    adminId = UUID.randomUUID();

    draftEvent = Event.builder()
        .id(eventId)
        .name("Symphony Draft")
        .status(EventStatus.DRAFT)
        .build();

    activeEvent = Event.builder()
        .id(eventId)
        .name("Symphony Live")
        .status(EventStatus.ONSALE)
        .build();

    ticketClass = TicketClass.builder()
        .id(ticketClassId)
        .eventId(eventId)
        .name("VIP")
        .colorCode("#FF0000")
        .price(new BigDecimal("100000"))
        .build();

    availableSeat = Seat.builder()
        .id(seatId)
        .eventId(eventId)
        .ticketClassId(ticketClassId)
        .gridRow(0)
        .gridColumn(0)
        .label("A1")
        .status(SeatStatus.AVAILABLE)
        .build();
  }

  @Test
  void createTicketClass_success() {
    // Arrange
    TicketClassCreateDTO createDTO = TicketClassCreateDTO.builder()
        .name("VIP")
        .colorCode("#FF0000")
        .price(new BigDecimal("100000"))
        .build();

    when(eventRepository.findById(eventId)).thenReturn(Optional.of(draftEvent));
    when(ticketClassRepository.save(any(TicketClass.class))).thenAnswer(inv -> inv.getArgument(0));

    // Act
    TicketClass result = adminCatalogService.createTicketClass(eventId, createDTO, adminId);

    // Assert
    assertNotNull(result);
    assertEquals("VIP", result.getName());
    assertEquals(eventId, result.getEventId());
    assertEquals(adminId, result.getCreatedBy());
  }

  @Test
  void createTicketClass_notDraftEvent_shouldThrowException() {
    // Arrange
    TicketClassCreateDTO createDTO = TicketClassCreateDTO.builder().build();
    when(eventRepository.findById(eventId)).thenReturn(Optional.of(activeEvent));

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> adminCatalogService.createTicketClass(eventId, createDTO, adminId));
    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    assertEquals("Chỉ được cấu hình hạng vé và ghế khi sự kiện đang ở trạng thái DRAFT", exception.getMessage());
  }

  @Test
  void updateTicketClass_success() {
    // Arrange
    AdminTicketClassUpdateDTO updateDTO = AdminTicketClassUpdateDTO.builder()
        .name("VIP Gold")
        .price(new BigDecimal("150000"))
        .build();

    when(ticketClassRepository.findById(ticketClassId)).thenReturn(Optional.of(ticketClass));
    when(eventRepository.findById(eventId)).thenReturn(Optional.of(draftEvent));
    when(seatRepository.hasSoldSeatsForTicketClass(ticketClassId)).thenReturn(false);
    when(ticketClassRepository.save(any(TicketClass.class))).thenAnswer(inv -> inv.getArgument(0));

    // Act
    TicketClass result = adminCatalogService.updateTicketClass(ticketClassId, updateDTO, adminId);

    // Assert
    assertNotNull(result);
    assertEquals("VIP Gold", result.getName());
    assertEquals(new BigDecimal("150000"), result.getPrice());
    assertEquals(adminId, result.getUpdatedBy());
  }

  @Test
  void updateTicketClass_hasSoldSeats_shouldThrowException() {
    // Arrange
    AdminTicketClassUpdateDTO updateDTO = AdminTicketClassUpdateDTO.builder().build();
    when(ticketClassRepository.findById(ticketClassId)).thenReturn(Optional.of(ticketClass));
    when(eventRepository.findById(eventId)).thenReturn(Optional.of(draftEvent));
    when(seatRepository.hasSoldSeatsForTicketClass(ticketClassId)).thenReturn(true);

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> adminCatalogService.updateTicketClass(ticketClassId, updateDTO, adminId));
    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    assertEquals("Không thể sửa hạng vé đã có ghế bán ra", exception.getMessage());
  }

  @Test
  void deleteTicketClass_preventIfAssignedToSeats() {
    // Arrange
    when(ticketClassRepository.findById(ticketClassId)).thenReturn(Optional.of(ticketClass));
    when(eventRepository.findById(eventId)).thenReturn(Optional.of(draftEvent));
    when(seatRepository.findByTicketClassId(ticketClassId)).thenReturn(List.of(availableSeat)); // Assigned

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> adminCatalogService.deleteTicketClass(ticketClassId));
    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    assertEquals("Không thể xóa hạng vé đang được gán cho ghế", exception.getMessage());
  }

  @Test
  void generateSeats_success() {
    // Arrange
    SeatGenerateDTO generateDTO = SeatGenerateDTO.builder()
        .ticketClassId(ticketClassId)
        .rowPrefix("A")
        .totalRows(2)
        .totalColumns(5)
        .build();

    when(eventRepository.findById(eventId)).thenReturn(Optional.of(draftEvent));
    when(ticketClassRepository.findById(ticketClassId)).thenReturn(Optional.of(ticketClass));
    when(seatRepository.existsByEventIdAndGridRowAndGridColumn(eq(eventId), anyInt(), anyInt())).thenReturn(false);

    // Act
    SeatGenerateResponseDTO result = adminCatalogService.generateSeats(eventId, generateDTO, adminId);

    // Assert
    assertNotNull(result);
    assertEquals(10, result.getCreatedCount()); // 2 rows * 5 columns
    verify(seatRepository, times(1)).saveAll(anyList());
  }

  @Test
  void generateSeats_invalidRowPrefix_shouldThrowException() {
    // Arrange
    SeatGenerateDTO generateDTO = SeatGenerateDTO.builder()
        .ticketClassId(ticketClassId)
        .rowPrefix("1") // Invalid row
        .totalRows(1)
        .totalColumns(1)
        .build();

    when(eventRepository.findById(eventId)).thenReturn(Optional.of(draftEvent));
    when(ticketClassRepository.findById(ticketClassId)).thenReturn(Optional.of(ticketClass));

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> adminCatalogService.generateSeats(eventId, generateDTO, adminId));
    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    assertEquals("Ký hiệu hàng bắt đầu không hợp lệ", exception.getMessage());
  }

  @Test
  void updateSeat_preventManualSoldStatus() {
    // Arrange
    SeatUpdateDTO updateDTO = SeatUpdateDTO.builder()
        .status(SeatStatus.SOLD) // Manual update to SOLD
        .build();

    when(seatRepository.findById(seatId)).thenReturn(Optional.of(availableSeat));

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> adminCatalogService.updateSeat(seatId, updateDTO, adminId));
    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    assertEquals("Không cập nhật SOLD thủ công từ admin", exception.getMessage());
  }

  @Test
  void deleteSeat_preventIfSold() {
    // Arrange
    availableSeat.setStatus(SeatStatus.SOLD);
    when(seatRepository.findById(seatId)).thenReturn(Optional.of(availableSeat));

    // Act & Assert
    AppException exception =
        assertThrows(
            AppException.class,
            () -> adminCatalogService.deleteSeat(seatId));
    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    assertEquals("Không thể xóa ghế đã bán", exception.getMessage());
  }
}
