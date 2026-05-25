package com.concert.booking.modules.customerbooking;

import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.customerbooking.dto.CheckoutRequestDTO;
import com.concert.booking.modules.customerbooking.dto.CheckoutSessionDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerEventDetailDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerEventSummaryDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerSeatCatalogDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerSeatDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerTicketClassDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerTicketDTO;
import com.concert.booking.modules.customerbooking.dto.SeatSnapshotDTO;
import com.concert.booking.modules.customerbooking.dto.SeatSummaryDTO;
import com.concert.booking.modules.event.Event;
import com.concert.booking.modules.event.EventRepository;
import com.concert.booking.modules.event.enums.EventStatus;
import com.concert.booking.modules.order.Order;
import com.concert.booking.modules.order.OrderRepository;
import com.concert.booking.modules.order.Payment;
import com.concert.booking.modules.order.PaymentRepository;
import com.concert.booking.modules.order.Ticket;
import com.concert.booking.modules.order.TicketRepository;
import com.concert.booking.modules.order.dto.OrderItemResponseDTO;
import com.concert.booking.modules.order.dto.OrderResponseDTO;
import com.concert.booking.modules.seat.Seat;
import com.concert.booking.modules.seat.SeatRepository;
import com.concert.booking.modules.seat.enums.SeatStatus;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.TicketClassRepository;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CustomerBookingServiceImpl implements CustomerBookingService {

  EventRepository eventRepository;
  SeatRepository seatRepository;
  TicketClassRepository ticketClassRepository;
  OrderRepository orderRepository;
  PaymentRepository paymentRepository;
  TicketRepository ticketRepository;

  @Override
  @Transactional(readOnly = true)
  public Page<CustomerEventSummaryDTO> getEvents(String keyword, String status, Pageable pageable) {
    return eventRepository
        .findCustomerVisibleEvents(
            normalizeKeyword(keyword), resolveCustomerVisibleStatuses(status), pageable)
        .map(this::toEventSummary);
  }

  @Override
  @Transactional(readOnly = true)
  public CustomerEventDetailDTO getEventDetail(UUID eventId) {
    Event event = getCustomerVisibleEvent(eventId);
    CustomerEventSummaryDTO summary = toEventSummary(event);

    return CustomerEventDetailDTO.builder()
        .id(summary.getId())
        .name(summary.getName())
        .location(summary.getLocation())
        .bannerUrl(summary.getBannerUrl())
        .teasingTime(summary.getTeasingTime())
        .openTime(summary.getOpenTime())
        .startTime(summary.getStartTime())
        .endTime(summary.getEndTime())
        .status(summary.getStatus())
        .ticketClasses(summary.getTicketClasses())
        .seatSummary(summary.getSeatSummary())
        .description(null)
        .build();
  }

  @Override
  @Transactional(readOnly = true)
  public CustomerSeatCatalogDTO getCatalog(UUID eventId) {
    Event event = getOnSaleEventForBooking(eventId);
    List<TicketClass> ticketClasses = ticketClassRepository.findByEventId(eventId);
    Map<UUID, TicketClass> ticketClassById =
        ticketClasses.stream().collect(Collectors.toMap(TicketClass::getId, Function.identity()));

    List<CustomerSeatDTO> seats =
        seatRepository.findByEventId(eventId).stream()
            .sorted(Comparator.comparingInt(Seat::getGridRow).thenComparingInt(Seat::getGridColumn))
            .map(seat -> toCustomerSeatDTO(seat, ticketClassById.get(seat.getTicketClassId())))
            .toList();

    return CustomerSeatCatalogDTO.builder()
        .eventId(event.getId())
        .eventName(event.getName())
        .generatedAt(Instant.now())
        .seats(seats)
        .build();
  }

  @Override
  public CheckoutSessionDTO checkout(CheckoutRequestDTO checkoutRequest, UUID customerId) {
    throw new UnsupportedOperationException("Phase 2: Redis checkout session chua implement");
  }

  @Override
  public CheckoutSessionDTO getCheckoutSession(UUID paymentSessionId, UUID customerId) {
    throw new UnsupportedOperationException("Phase 2: Redis checkout session chua implement");
  }

  @Override
  public void releaseCheckout(UUID paymentSessionId, UUID customerId) {
    throw new UnsupportedOperationException("Phase 2: Redis checkout session chua implement");
  }

  @Override
  public OrderResponseDTO confirmPaymentSessionDev(UUID paymentSessionId, UUID customerId) {
    throw new UnsupportedOperationException("Phase 4: confirm payment dev chua implement");
  }

  @Override
  @Transactional(readOnly = true)
  public OrderResponseDTO getCustomerOrder(UUID orderId, UUID customerId) {
    Order order = getOwnedOrder(orderId, customerId);
    Payment payment =
        paymentRepository
            .findByOrderId(order.getId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay thanh toan"));
    List<Ticket> tickets = ticketRepository.findByOrderId(order.getId());
    Map<UUID, TicketClass> ticketClassById =
        ticketClassRepository.findByEventId(order.getEventId()).stream()
            .collect(Collectors.toMap(TicketClass::getId, Function.identity()));

    return toOrderResponse(order, payment, tickets, ticketClassById);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<CustomerTicketDTO> getTickets(UUID customerId, Pageable pageable) {
    return ticketRepository
        .findCustomerTickets(customerId, pageable)
        .map(ticket -> {
          Order order = getOwnedOrder(ticket.getOrderId(), customerId);
          Event event =
              eventRepository
                  .findById(order.getEventId())
                  .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay su kien"));
          TicketClass ticketClass = ticketClassRepository.findById(ticket.getTicketClassId()).orElse(null);
          return toCustomerTicketDTO(ticket, order, event, ticketClass);
        });
  }

  @Override
  @Transactional(readOnly = true)
  public SeatSnapshotDTO getSeatSnapshot(UUID eventId) {
    List<UUID> soldSeatIds =
        seatRepository.findSoldSeatsByEventId(eventId).stream().map(Seat::getId).toList();
    return SeatSnapshotDTO.builder()
        .eventId(eventId)
        .heldSeatIds(List.of())
        .soldSeatIds(soldSeatIds)
        .generatedAt(Instant.now())
        .build();
  }

  private Event getCustomerVisibleEvent(UUID eventId) {
    Event event =
        eventRepository
            .findById(eventId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay su kien"));

    if (event.getStatus() != EventStatus.TEASING && event.getStatus() != EventStatus.ONSALE) {
      throw new AppException(HttpStatus.NOT_FOUND, "Khong tim thay su kien");
    }
    return event;
  }

  private Event getOnSaleEventForBooking(UUID eventId) {
    Event event =
        eventRepository
            .findById(eventId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay su kien"));

    if (event.getStatus() != EventStatus.ONSALE) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Su kien chua mo ban");
    }
    Timestamp now = Timestamp.from(Instant.now());
    if (event.getStartTime() != null && !event.getStartTime().after(now)) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Su kien da bat dau, khong the mua ve");
    }
    return event;
  }

  private List<EventStatus> resolveCustomerVisibleStatuses(String status) {
    if (status == null || status.isBlank() || status.equalsIgnoreCase("ALL")) {
      return List.of(EventStatus.TEASING, EventStatus.ONSALE);
    }

    EventStatus parsed;
    try {
      parsed = EventStatus.valueOf(status.trim().toUpperCase());
    } catch (IllegalArgumentException ex) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Trang thai su kien khong hop le");
    }

    if (parsed != EventStatus.TEASING && parsed != EventStatus.ONSALE) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Trang thai su kien khong duoc phep xem");
    }
    return List.of(parsed);
  }

  private String normalizeKeyword(String keyword) {
    if (keyword == null || keyword.isBlank()) {
      return null;
    }
    return keyword.trim();
  }

  private CustomerEventSummaryDTO toEventSummary(Event event) {
    boolean onSale = event.getStatus() == EventStatus.ONSALE;
    List<TicketClass> ticketClasses =
        onSale ? ticketClassRepository.findByEventId(event.getId()) : List.of();
    long totalSeats = onSale ? seatRepository.countByEventId(event.getId()) : 0;
    long availableSeats =
        onSale ? seatRepository.countByEventIdAndStatus(event.getId(), SeatStatus.AVAILABLE) : 0;

    return CustomerEventSummaryDTO.builder()
        .id(event.getId())
        .name(event.getName())
        .location(event.getLocation())
        .bannerUrl(event.getBannerUrl())
        .teasingTime(event.getTeasingTime())
        .openTime(event.getOpenTime())
        .startTime(event.getStartTime())
        .endTime(event.getEndTime())
        .status(event.getStatus())
        .ticketClasses(ticketClasses.stream().map(this::toTicketClassDTO).toList())
        .seatSummary(SeatSummaryDTO.builder().total(totalSeats).available(availableSeats).build())
        .build();
  }

  private CustomerTicketClassDTO toTicketClassDTO(TicketClass ticketClass) {
    return CustomerTicketClassDTO.builder()
        .id(ticketClass.getId())
        .name(ticketClass.getName())
        .colorCode(ticketClass.getColorCode())
        .price(ticketClass.getPrice())
        .build();
  }

  private CustomerSeatDTO toCustomerSeatDTO(Seat seat, TicketClass ticketClass) {
    return CustomerSeatDTO.builder()
        .id(seat.getId())
        .label(toSeatLabel(seat))
        .gridRow(seat.getGridRow())
        .gridColumn(seat.getGridColumn())
        .ticketClassId(seat.getTicketClassId())
        .ticketClassName(ticketClass != null ? ticketClass.getName() : "Unknown")
        .price(ticketClass != null ? ticketClass.getPrice() : BigDecimal.ZERO)
        .colorCode(ticketClass != null ? ticketClass.getColorCode() : null)
        .status(seat.getStatus().name())
        .build();
  }

  private CustomerTicketDTO toCustomerTicketDTO(
      Ticket ticket, Order order, Event event, TicketClass ticketClass) {
    return CustomerTicketDTO.builder()
        .ticketId(ticket.getId())
        .orderId(order.getId())
        .orderCode(order.getOrderCode())
        .eventId(event.getId())
        .eventName(event.getName())
        .eventLocation(event.getLocation())
        .eventStartTime(event.getStartTime())
        .seatId(ticket.getSeatId())
        .seatLabel(ticket.getSeatLabel())
        .label(ticket.getSeatLabel())
        .ticketClassId(ticket.getTicketClassId())
        .ticketClassName(ticketClass != null ? ticketClass.getName() : null)
        .ticketClassColorCode(ticketClass != null ? ticketClass.getColorCode() : null)
        .price(ticket.getPrice())
        .status(ticket.getStatus())
        .qrPayload(ticket.getId().toString())
        .build();
  }

  private Order getOwnedOrder(UUID orderId, UUID customerId) {
    Order order =
        orderRepository
            .findById(orderId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay don hang"));
    if (!order.getCustomerId().equals(customerId)) {
      throw new AppException(HttpStatus.FORBIDDEN, "Ban khong co quyen xem don hang nay");
    }
    return order;
  }

  private OrderResponseDTO toOrderResponse(
      Order order, Payment payment, List<Ticket> tickets, Map<UUID, TicketClass> ticketClassById) {
    Event event = eventRepository.findById(order.getEventId()).orElse(null);
    return OrderResponseDTO.builder()
        .orderId(order.getId())
        .orderCode(order.getOrderCode())
        .customerId(order.getCustomerId())
        .eventId(order.getEventId())
        .eventName(event != null ? event.getName() : null)
        .eventLocation(event != null ? event.getLocation() : null)
        .eventStartTime(event != null ? event.getStartTime() : null)
        .status(order.getStatus())
        .totalAmount(order.getTotalAmount())
        .paymentMethod(payment.getPaymentMethod())
        .paymentStatus(payment.getStatus())
        .amountReceived(payment.getAmountReceived() != null ? payment.getAmountReceived() : payment.getAmount())
        .items(
            tickets.stream()
                .map(ticket -> toTicketResponse(ticket, ticketClassById.get(ticket.getTicketClassId())))
                .toList())
        .build();
  }

  private OrderItemResponseDTO toTicketResponse(Ticket ticket, TicketClass ticketClass) {
    return OrderItemResponseDTO.builder()
        .id(ticket.getId())
        .seatId(ticket.getSeatId())
        .ticketClassId(ticket.getTicketClassId())
        .ticketClassName(ticketClass != null ? ticketClass.getName() : null)
        .seatLabel(ticket.getSeatLabel())
        .label(ticket.getSeatLabel())
        .price(ticket.getPrice())
        .ticketClass(toTicketClassInfo(ticketClass))
        .build();
  }

  private OrderItemResponseDTO.TicketClassInfoDTO toTicketClassInfo(TicketClass ticketClass) {
    if (ticketClass == null) {
      return null;
    }
    return OrderItemResponseDTO.TicketClassInfoDTO.builder()
        .id(ticketClass.getId())
        .name(ticketClass.getName())
        .colorCode(ticketClass.getColorCode())
        .price(ticketClass.getPrice())
        .build();
  }

  private String toSeatLabel(Seat seat) {
    if (seat.getLabel() != null && !seat.getLabel().isBlank()) {
      return seat.getLabel();
    }
    return (char) ('A' + seat.getGridRow()) + String.valueOf(seat.getGridColumn() + 1);
  }
}
