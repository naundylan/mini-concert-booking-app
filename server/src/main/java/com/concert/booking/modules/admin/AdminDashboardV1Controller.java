package com.concert.booking.modules.admin;

import com.concert.booking.common.dto.DataApiResponse;
import com.concert.booking.modules.admin.dto.AdminDashboardStatsDTO;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminDashboardV1Controller {
  AdminDashboardStatsService statsService;

  @GetMapping("/stats")
  @PreAuthorize("hasRole('ADMIN')")
  public DataApiResponse<AdminDashboardStatsDTO> getDashboardStats(
      @RequestParam(defaultValue = "30") int timeRange) {
    AdminDashboardStatsDTO stats = statsService.getStats(timeRange);
    return DataApiResponse.success(stats, "Lấy số liệu thống kê dashboard thành công");
  }
}
