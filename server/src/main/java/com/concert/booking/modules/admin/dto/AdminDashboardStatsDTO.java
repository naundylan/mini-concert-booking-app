package com.concert.booking.modules.admin.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminDashboardStatsDTO {
  BigDecimal totalRevenue;
  double totalRevenueChange;
  long ticketsSold;
  double ticketsSoldChange;
  long activeEventsCount;
  double checkInRate;
  List<ChartPointDTO> chartData;

  @Value
  @Builder
  public static class ChartPointDTO {
    String date;
    BigDecimal sales;
    boolean highlight;
  }
}
