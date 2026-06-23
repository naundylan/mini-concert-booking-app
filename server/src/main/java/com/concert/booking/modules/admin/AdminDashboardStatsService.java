package com.concert.booking.modules.admin;

import com.concert.booking.modules.admin.dto.AdminDashboardStatsDTO;

public interface AdminDashboardStatsService {
  AdminDashboardStatsDTO getStats(int timeRangeDays);
}
