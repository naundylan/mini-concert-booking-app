package com.concert.booking.modules.audit;

import com.concert.booking.common.dto.DataApiResponse;
import com.concert.booking.modules.audit.enums.AuditLogAction;
import com.concert.booking.modules.audit.enums.AuditLogStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "Admin Audit Logs", description = "Các API truy vấn Nhật ký hoạt động dành cho Admin")
public class AdminAuditLogV1Controller {

  AuditLogRepository auditLogRepository;

  @Operation(
      summary = "Lấy danh sách Nhật ký hoạt động",
      description = "Admin xem và lọc nhật ký hoạt động hệ thống.")
  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public DataApiResponse<Page<AuditLog>> getAuditLogs(
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) AuditLogStatus status,
      @RequestParam(required = false) AuditLogAction action,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    Page<AuditLog> result =
        auditLogRepository.findAll(AuditLogSpecification.filter(keyword, status, action), pageable);
    return DataApiResponse.success(result, "Lấy danh sách nhật ký thành công");
  }
}
