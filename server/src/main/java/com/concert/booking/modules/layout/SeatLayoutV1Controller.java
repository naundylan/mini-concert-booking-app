package com.concert.booking.modules.layout;

import com.concert.booking.common.dto.DataApiResponse;
import com.concert.booking.common.dto.PagedApiResponse;
import com.concert.booking.modules.auth.security.AuthUtils;
import com.concert.booking.modules.layout.dto.*;
import jakarta.validation.Valid;
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
public class SeatLayoutV1Controller {
  SeatLayoutService seatLayoutService;

  @GetMapping("/layouts")
  public PagedApiResponse<LayoutResponseDTO> search(
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) LayoutStatus status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return PagedApiResponse.success(
        seatLayoutService.search(keyword, status, page, size), "Lấy danh sách layout thành công");
  }

  @PostMapping("/layouts")
  public DataApiResponse<LayoutResponseDTO> create(@RequestBody @Valid LayoutCreateDTO dto) {
    return DataApiResponse.success(
        seatLayoutService.create(dto, AuthUtils.getCurrentUserId()), "Tạo layout thành công");
  }

  @GetMapping("/layouts/{id}")
  public DataApiResponse<LayoutResponseDTO> getById(@PathVariable UUID id) {
    return DataApiResponse.success(seatLayoutService.getById(id), "Lấy layout thành công");
  }

  @PatchMapping("/layouts/{id}")
  public DataApiResponse<LayoutResponseDTO> update(
      @PathVariable UUID id, @RequestBody @Valid LayoutUpdateDTO dto) {
    return DataApiResponse.success(
        seatLayoutService.update(id, dto, AuthUtils.getCurrentUserId()),
        "Cập nhật layout thành công");
  }

  @DeleteMapping("/layouts/{id}")
  public DataApiResponse<Void> archive(@PathVariable UUID id) {
    seatLayoutService.archive(id, AuthUtils.getCurrentUserId());
    return DataApiResponse.success(null, "Lưu trữ layout thành công");
  }

  @PostMapping("/layouts/{id}/publish")
  public DataApiResponse<LayoutResponseDTO> publish(@PathVariable UUID id) {
    return DataApiResponse.success(
        seatLayoutService.publish(id, AuthUtils.getCurrentUserId()), "Publish layout thành công");
  }

  @PostMapping("/layouts/{id}/clone")
  public DataApiResponse<LayoutResponseDTO> clone(@PathVariable UUID id) {
    return DataApiResponse.success(
        seatLayoutService.clone(id, AuthUtils.getCurrentUserId()), "Clone layout thành công");
  }

  @PostMapping("/events/{eventId}/layouts/{layoutId}/apply")
  public DataApiResponse<LayoutApplyResponseDTO> apply(
      @PathVariable UUID eventId,
      @PathVariable UUID layoutId,
      @RequestBody @Valid LayoutApplyDTO dto) {
    return DataApiResponse.success(
        seatLayoutService.applyToEvent(eventId, layoutId, dto, AuthUtils.getCurrentUserId()),
        "Apply layout thành công");
  }
}
