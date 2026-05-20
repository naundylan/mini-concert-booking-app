package com.concert.booking.modules.admin;

import com.concert.booking.common.dto.DataApiResponse;
import com.concert.booking.modules.admin.dto.*;
import com.concert.booking.modules.auth.security.AuthUtils;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.dto.TicketClassCreateDTO;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminCatalogV1Controller {
  AdminCatalogService adminCatalogService;

  @PostMapping("/events/{eventId}/ticket-classes")
  public DataApiResponse<TicketClass> createTicketClass(
      @PathVariable UUID eventId, @RequestBody @Valid TicketClassCreateDTO dto) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(
        adminCatalogService.createTicketClass(eventId, dto, currentUserId),
        "Tạo hạng vé thành công");
  }

  @GetMapping("/events/{eventId}/ticket-classes")
  public DataApiResponse<List<TicketClass>> getTicketClasses(@PathVariable UUID eventId) {
    return DataApiResponse.success(
        adminCatalogService.getTicketClasses(eventId), "Lấy danh sách hạng vé thành công");
  }

  @PatchMapping("/ticket-classes/{id}")
  public DataApiResponse<TicketClass> updateTicketClass(
      @PathVariable UUID id, @RequestBody @Valid AdminTicketClassUpdateDTO dto) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(
        adminCatalogService.updateTicketClass(id, dto, currentUserId),
        "Cập nhật hạng vé thành công");
  }

  @DeleteMapping("/ticket-classes/{id}")
  public DataApiResponse<Void> deleteTicketClass(@PathVariable UUID id) {
    adminCatalogService.deleteTicketClass(id);
    return DataApiResponse.success(null, "Xóa hạng vé thành công");
  }

  @PostMapping("/events/{eventId}/seats/generate")
  public DataApiResponse<SeatGenerateResponseDTO> generateSeats(
      @PathVariable UUID eventId, @RequestBody @Valid SeatGenerateDTO dto) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(
        adminCatalogService.generateSeats(eventId, dto, currentUserId),
        "Tạo ghế thành công");
  }

  @GetMapping("/events/{eventId}/seats")
  public DataApiResponse<List<SeatResponseDTO>> getSeats(@PathVariable UUID eventId) {
    return DataApiResponse.success(
        adminCatalogService.getSeats(eventId), "Lấy danh sách ghế thành công");
  }

  @PatchMapping("/seats/{id}")
  public DataApiResponse<SeatResponseDTO> updateSeat(
      @PathVariable UUID id, @RequestBody @Valid SeatUpdateDTO dto) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(
        adminCatalogService.updateSeat(id, dto, currentUserId), "Cập nhật ghế thành công");
  }

  @DeleteMapping("/seats/{id}")
  public DataApiResponse<Void> deleteSeat(@PathVariable UUID id) {
    adminCatalogService.deleteSeat(id);
    return DataApiResponse.success(null, "Xóa ghế thành công");
  }
}
