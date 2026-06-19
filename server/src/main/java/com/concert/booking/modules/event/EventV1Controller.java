package com.concert.booking.modules.event;

import com.concert.booking.common.dto.DataApiResponse;
import com.concert.booking.common.swagger.BadRequestApiResponse;
import com.concert.booking.modules.auth.security.AuthUtils;
import com.concert.booking.modules.event.dto.*;
import com.concert.booking.modules.seat.dto.SeatLayoutDTO;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.dto.TicketClassCreateDTO;
import com.concert.booking.modules.ticket.dto.TicketClassUpdateDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Event Management", description = "Các API quản lý sự kiện và sơ đồ ghế")
@PreAuthorize("hasRole('ADMIN')")
public class EventV1Controller {

  EventService eventService;

  /** [US-A03] Tạo sự kiện mới ở trạng thái DRAFT */
  @Operation(summary = "Tạo sự kiện mới", description = "Admin tạo sự kiện mới (DRAFT).")
  @BadRequestApiResponse
  @PostMapping
  public DataApiResponse<Event> createEvent(@RequestBody @Valid EventCreateDTO dto) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    Event event = eventService.createEvent(dto, currentUserId);
    return DataApiResponse.success(event, "Tạo sự kiện thành công");
  }

  @Operation(summary = "Lấy danh sách sự kiện", description = "Lấy tất cả sự kiện.")
  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN')")
  public DataApiResponse<List<Event>> getAllEvents() {
    List<Event> events = eventService.getAllEvents();
    return DataApiResponse.success(events, "Lấy danh sách sự kiện thành công");
  }

  /** [US-A03] Định giá vé - Tạo tối thiểu 3 hạng vé */
  @Operation(
      summary = "Tạo hạng vé (Ticket Classes)",
      description = "Thiết lập tối thiểu 3 hạng vé (VIP, Standard...).")
  @BadRequestApiResponse
  @PostMapping("/{id}/ticket-classes")
  public DataApiResponse<List<TicketClass>> defineTicketClasses(
      @PathVariable UUID id, @RequestBody @Valid List<TicketClassCreateDTO> dtos) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    List<TicketClass> classes = eventService.defineTicketClasses(id, dtos, currentUserId);
    return DataApiResponse.success(classes, "Thiết lập hạng vé thành công");
  }

  /**
   * [US-A03] Cập nhật giá vé cho hạng vé cụ thể Price Locking: Không được cập nhật nếu có vé SOLD
   */
  @Operation(summary = "Cập nhật giá vé", description = "Cập nhật giá vé cho hạng vé.")
  @BadRequestApiResponse
  @PatchMapping("/ticket-classes/{ticketClassId}/price")
  public DataApiResponse<TicketClass> updateTicketClassPrice(
      @PathVariable UUID ticketClassId, @RequestBody @Valid TicketClassUpdateDTO dto) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    TicketClass ticketClass =
        eventService.updateTicketClassPrice(ticketClassId, dto, currentUserId);
    return DataApiResponse.success(ticketClass, "Cập nhật giá vé thành công");
  }

  /** Lưu sơ đồ ghế Layout Safety: Không được xóa/thay đổi ticket class của ghế SOLD */
  @Operation(
      summary = "Lưu sơ đồ ghế",
      description = "Nhận ma trận tọa độ ghế từ Frontend (Layout Safety validation).")
  @BadRequestApiResponse
  @PostMapping("/{id}/seats")
  public DataApiResponse<Void> saveSeatLayout(
      @PathVariable UUID id, @RequestBody @Valid SeatLayoutDTO dto) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    eventService.saveSeatLayout(id, dto, currentUserId);
    return DataApiResponse.success(null, "Lưu sơ đồ ghế thành công");
  }

  /**
   * [US-A03] Cập nhật trạng thái ghế (đặc biệt là MAINTENANCE) Maintenance: Ghế hỏng vật lý, không
   * thể chọn mua nhưng giữ vị trí
   */
  @Operation(
      summary = "Cập nhật trạng thái ghế",
      description = "Cập nhật trạng thái ghế (AVAILABLE, MAINTENANCE, SOLD, LOCKED).")
  @BadRequestApiResponse
  @PatchMapping("/seats/{seatId}/status")
  public DataApiResponse<Void> updateSeatStatus(
      @PathVariable UUID seatId, @RequestBody @Valid SeatStatusUpdateDTO dto) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    eventService.updateSeatStatus(seatId, dto.getStatus(), currentUserId);
    return DataApiResponse.success(null, "Cập nhật trạng thái ghế thành công");
  }

  /** [US-A03] Cập nhật trạng thái sự kiện */
  @Operation(
      summary = "Cập nhật trạng thái sự kiện",
      description = "Chuyển status thủ công (DRAFT -> TEASING -> ONSALE -> ENDED).")
  @BadRequestApiResponse
  @PatchMapping("/{id}/status")
  public DataApiResponse<Event> updateEventStatus(
      @PathVariable UUID id, @RequestBody @Valid EventStatusUpdateDTO dto) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    Event event = eventService.updateEventStatus(id, dto, currentUserId);
    return DataApiResponse.success(event, "Cập nhật trạng thái thành công");
  }

  @Operation(summary = "Cập nhật thông tin sự kiện")
  @PatchMapping("/{id}")
  public DataApiResponse<Event> updateEvent(
      @PathVariable UUID id, @RequestBody @Valid EventUpdateDTO dto) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    Event event = eventService.updateEvent(id, dto, currentUserId);
    return DataApiResponse.success(event, "Cập nhật sự kiện thành công");
  }

  /** GET: Lấy thông tin chi tiết sự kiện */
  @Operation(summary = "Lấy thông tin sự kiện", description = "Lấy chi tiết sự kiện.")
  @BadRequestApiResponse
  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN')")
  public DataApiResponse<Event> getEventById(@PathVariable UUID id) {
    Event event = eventService.getEventById(id);
    return DataApiResponse.success(event, "Lấy thông tin sự kiện thành công");
  }

  /** GET: Lấy danh sách tất cả hạng vé của sự kiện */
  @Operation(summary = "Lấy danh sách hạng vé", description = "Lấy tất cả hạng vé của sự kiện.")
  @BadRequestApiResponse
  @GetMapping("/{id}/ticket-classes")
  @PreAuthorize("hasAnyRole('ADMIN')")
  public DataApiResponse<List<TicketClass>> getTicketClasses(@PathVariable UUID id) {
    List<TicketClass> classes = eventService.getTicketClassesByEventId(id);
    return DataApiResponse.success(classes, "Lấy danh sách hạng vé thành công");
  }

  /** GET: Lấy sơ đồ ghế của sự kiện */
  @Operation(summary = "Lấy sơ đồ ghế", description = "Lấy ma trận tọa độ ghế của sự kiện.")
  @BadRequestApiResponse
  @GetMapping("/{id}/seats")
  @PreAuthorize("hasAnyRole('ADMIN')")
  public DataApiResponse<SeatLayoutDTO> getSeatLayout(@PathVariable UUID id) {
    SeatLayoutDTO layout = eventService.getSeatLayout(id);
    return DataApiResponse.success(layout, "Lấy sơ đồ ghế thành công");
  }
}
