package com.concert.booking.modules.admin;

import com.concert.booking.modules.admin.dto.AdminDashboardStatsDTO;
import com.concert.booking.modules.admin.dto.AdminDashboardStatsDTO.ChartPointDTO;
import com.concert.booking.modules.order.Order;
import com.concert.booking.modules.order.OrderRepository;
import com.concert.booking.modules.order.TicketRepository;
import com.concert.booking.modules.order.enums.OrderStatus;
import com.concert.booking.modules.event.EventRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminDashboardStatsServiceImpl implements AdminDashboardStatsService {

  final OrderRepository orderRepository;
  final TicketRepository ticketRepository;
  final EventRepository eventRepository;
  final StringRedisTemplate redisTemplate;

  @Value("${application.kafka.enabled:false}")
  boolean kafkaEnabled;

  @Override
  public AdminDashboardStatsDTO getStats(int timeRangeDays) {
    Instant now = Instant.now();
    Instant currentPeriodStart = now.minus(timeRangeDays, ChronoUnit.DAYS);
    Instant previousPeriodStart = now.minus(timeRangeDays * 2, ChronoUnit.DAYS);

    // 1. Calculate Revenue
    BigDecimal currentRevenue = orderRepository
        .sumRevenueBetween(OrderStatus.PAID, currentPeriodStart, now)
        .orElse(BigDecimal.ZERO);
    BigDecimal previousRevenue = orderRepository
        .sumRevenueBetween(OrderStatus.PAID, previousPeriodStart, currentPeriodStart)
        .orElse(BigDecimal.ZERO);

    double totalRevenueChange = calculatePercentageChange(currentRevenue, previousRevenue);

    // 2. Calculate Tickets Sold
    long currentTickets = ticketRepository.countTicketsSoldBetween(currentPeriodStart, now);
    long previousTickets = ticketRepository.countTicketsSoldBetween(previousPeriodStart, currentPeriodStart);

    double ticketsSoldChange = calculatePercentageChange(BigDecimal.valueOf(currentTickets), BigDecimal.valueOf(previousTickets));

    // 3. Active Events Count
    long activeEvents = eventRepository.countActiveEvents();

    // 4. Check-in Rate
    long usedTickets = ticketRepository.countUsedTickets();
    long totalPaidTickets = ticketRepository.countTotalPaidTickets();
    double checkInRate = totalPaidTickets == 0 ? 0.0 : ((double) usedTickets / totalPaidTickets) * 100.0;
    checkInRate = Math.round(checkInRate * 10.0) / 10.0; // Round to 1 decimal place

    // 5. System Health Check
    boolean isRedisHealthy = false;
    try {
      redisTemplate.getConnectionFactory().getConnection().ping();
      isRedisHealthy = true;
    } catch (Exception e) {
      // Log connection error silently or handle
    }

    // 6. Generate Chart Data
    List<Order> recentOrders = orderRepository.findPaidOrdersSince(currentPeriodStart);
    List<ChartPointDTO> chartData = generateChartPoints(recentOrders, timeRangeDays);

    return AdminDashboardStatsDTO.builder()
        .totalRevenue(currentRevenue)
        .totalRevenueChange(totalRevenueChange)
        .ticketsSold(currentTickets)
        .ticketsSoldChange(ticketsSoldChange)
        .activeEventsCount(activeEvents)
        .checkInRate(checkInRate)
        .chartData(chartData)
        .build();
  }

  private double calculatePercentageChange(BigDecimal current, BigDecimal previous) {
    if (previous.compareTo(BigDecimal.ZERO) == 0) {
      return current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
    }
    BigDecimal change = current.subtract(previous);
    BigDecimal pct = change.multiply(BigDecimal.valueOf(100.0)).divide(previous, 2, RoundingMode.HALF_UP);
    return pct.doubleValue();
  }

  private List<ChartPointDTO> generateChartPoints(List<Order> orders, int days) {
    ZoneId zoneId = ZoneId.systemDefault();
    LocalDate today = LocalDate.now(zoneId);
    LocalDate startDate = today.minusDays(days - 1);

    // Map to store grouped sales by date string
    Map<String, BigDecimal> salesMap = new HashMap<>();

    // Formatter depending on time range size
    DateTimeFormatter formatter = days <= 7 
        ? DateTimeFormatter.ofPattern("EEE", Locale.ENGLISH)
        : DateTimeFormatter.ofPattern("dd/MM");

    for (Order order : orders) {
      LocalDate orderDate = LocalDate.ofInstant(order.getCreatedAt(), zoneId);
      if (!orderDate.isBefore(startDate)) {
        String key = orderDate.format(formatter);
        salesMap.put(key, salesMap.getOrDefault(key, BigDecimal.ZERO).add(order.getTotalAmount()));
      }
    }

    List<ChartPointDTO> points = new ArrayList<>();
    BigDecimal maxSales = BigDecimal.ZERO;
    String maxSalesKey = "";

    // Fill each day in the range
    for (int i = 0; i < days; i++) {
      LocalDate date = startDate.plusDays(i);
      String key = date.format(formatter);
      BigDecimal sales = salesMap.getOrDefault(key, BigDecimal.ZERO);
      
      if (sales.compareTo(maxSales) > 0) {
        maxSales = sales;
        maxSalesKey = key;
      }

      points.add(ChartPointDTO.builder()
          .date(key)
          .sales(sales)
          .highlight(false) // Will highlight the max afterwards
          .build());
    }

    // Set highlight for the max sales day
    final String finalMaxKey = maxSalesKey;
    if (!finalMaxKey.isEmpty() && maxSales.compareTo(BigDecimal.ZERO) > 0) {
      return points.stream()
          .map(p -> p.getDate().equals(finalMaxKey)
              ? ChartPointDTO.builder().date(p.getDate()).sales(p.getSales()).highlight(true).build()
              : p)
          .collect(Collectors.toList());
    }

    return points;
  }
}
