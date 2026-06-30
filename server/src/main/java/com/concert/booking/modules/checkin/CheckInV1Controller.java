package com.concert.booking.modules.checkin;

import com.concert.booking.common.dto.DataApiResponse;
import com.concert.booking.modules.auth.security.AuthUtils;
import com.concert.booking.modules.checkin.dto.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/check-in")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CheckInV1Controller {
  CheckInService checkInService;

  @GetMapping("/events")
  @PreAuthorize("hasRole('STAFF')")
  public DataApiResponse<List<CheckInEventDTO>> getCheckInEvents() {
    return DataApiResponse.success(
        checkInService.getCheckInEvents(), "Lấy danh sách sự kiện check-in thành công");
  }

  @GetMapping("/search")
  @PreAuthorize("hasRole('STAFF')")
  public DataApiResponse<List<CheckInOrderDTO>> search(
      @RequestParam UUID eventId, @RequestParam String keyword) {
    return DataApiResponse.success(
        checkInService.search(eventId, keyword), "Tìm vé check-in thành công");
  }

  @PostMapping("/tickets/{ticketId}")
  @PreAuthorize("hasRole('STAFF')")
  public DataApiResponse<CheckInResponseDTO> checkInTicket(
      @PathVariable UUID ticketId, @RequestBody @Valid TicketCheckInRequestDTO request) {
    UUID staffId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(
        checkInService.checkInTicket(ticketId, request.getEventId(), staffId),
        "Xử lý check-in thành công");
  }

  @GetMapping("/history")
  @PreAuthorize("hasRole('STAFF')")
  public DataApiResponse<List<CheckInHistoryDTO>> getHistory(
      @RequestParam(required = false) UUID eventId,
      @RequestParam(required = false) String keyword) {
    UUID staffId = AuthUtils.getCurrentUserId();
    return DataApiResponse.success(
        checkInService.getHistory(eventId, keyword, staffId), "Lấy lịch sử check-in thành công");
  }
}
