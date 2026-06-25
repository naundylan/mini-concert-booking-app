package com.concert.booking.modules.checkin;

import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.checkin.dto.*;
import com.concert.booking.modules.event.Event;
import com.concert.booking.modules.event.EventRepository;
import com.concert.booking.modules.event.enums.EventStatus;
import com.concert.booking.modules.order.Order;
import com.concert.booking.modules.order.OrderRepository;
import com.concert.booking.modules.order.Ticket;
import com.concert.booking.modules.order.TicketRepository;
import com.concert.booking.modules.order.enums.OrderStatus;
import com.concert.booking.modules.order.enums.TicketStatus;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.TicketClassRepository;
import com.concert.booking.modules.user.User;
import com.concert.booking.modules.user.UserRepository;
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
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CheckInServiceImpl implements CheckInService {
  EventRepository eventRepository;
  OrderRepository orderRepository;
  TicketRepository ticketRepository;
  TicketClassRepository ticketClassRepository;
  UserRepository userRepository;

  @Override
  @Transactional(readOnly = true)
  public List<CheckInEventDTO> getCheckInEvents() {
    Timestamp now = Timestamp.from(Instant.now());
    return eventRepository
        .findCheckInCandidates(List.of(EventStatus.ONSALE, EventStatus.ENDED), now)
        .stream()
        .filter(event -> isWithinCheckInWindow(event, now))
        .sorted(
            Comparator.comparing(
                Event::getStartTime, Comparator.nullsLast(Comparator.naturalOrder())))
        .map(this::toEventDTO)
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public List<CheckInOrderDTO> search(UUID eventId, String keyword) {
    if (eventId == null) {
      throw new AppException(HttpStatus.BAD_REQUEST, "eventId là bắt buộc");
    }
    String normalizedKeyword = keyword == null ? "" : keyword.trim();
    if (normalizedKeyword.isBlank()) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Từ khóa tìm kiếm không được để trống");
    }
    ensureCheckInEvent(eventId);

    List<Order> orders = orderRepository.searchCheckInOrders(eventId, normalizedKeyword);
    return orders.stream().map(this::toOrderDTO).toList();
  }

  @Override
  @Transactional
  public CheckInResponseDTO checkInTicket(UUID ticketId, UUID eventId, UUID staffId) {
    if (eventId == null) {
      throw new AppException(HttpStatus.BAD_REQUEST, "eventId là bắt buộc");
    }
    if (staffId == null) {
      throw new AppException(HttpStatus.UNAUTHORIZED, "Không xác định được nhân viên check-in");
    }
    ensureCheckInEvent(eventId);

    Ticket ticket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy vé"));
    Order order =
        orderRepository
            .findById(ticket.getOrderId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
    User customer =
        userRepository
            .findById(order.getCustomerId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy khách hàng"));

    if (!eventId.equals(order.getEventId())) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Vé không thuộc sự kiện này");
    }
    if (order.getStatus() != OrderStatus.PAID) {
      return toResponse(
          CheckInResultStatus.INVALID,
          "Đơn hàng chưa hoàn tất thanh toán",
          order,
          customer,
          ticket);
    }
    if (ticket.getStatus() == TicketStatus.CANCELED) {
      return toResponse(CheckInResultStatus.CANCELED, "Vé đã bị hủy", order, customer, ticket);
    }
    if (ticket.getStatus() == TicketStatus.USED) {
      return toResponse(CheckInResultStatus.ALREADY_USED, "Vé đã sử dụng", order, customer, ticket);
    }
    if (ticket.getStatus() != TicketStatus.UNUSED) {
      return toResponse(
          CheckInResultStatus.INVALID, "Trạng thái vé không hợp lệ", order, customer, ticket);
    }

    Timestamp now = Timestamp.from(Instant.now());
    ticket.setStatus(TicketStatus.USED);
    ticket.setCheckInTime(now);
    ticket.setCheckInBy(staffId);
    ticket.setUpdatedBy(staffId);

    Ticket savedTicket;
    try {
      savedTicket = ticketRepository.saveAndFlush(ticket);
    } catch (OptimisticLockingFailureException ex) {
      return resolveOptimisticLockConflict(ticketId, order, customer);
    }

    return toResponse(CheckInResultStatus.ACCEPTED, "Cho vào cổng", order, customer, savedTicket);
  }

  @Override
  @Transactional(readOnly = true)
  public List<CheckInHistoryDTO> getHistory(UUID eventId, String keyword, UUID staffId) {
    String normalizedKeyword = keyword == null ? "" : keyword.trim();
    return ticketRepository
        .findCheckInHistory(eventId, normalizedKeyword, staffId, PageRequest.of(0, 100))
        .stream()
        .map(this::toHistoryDTO)
        .toList();
  }

  private void ensureCheckInEvent(UUID eventId) {
    Event event =
        eventRepository
            .findById(eventId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện"));
    Timestamp now = Timestamp.from(Instant.now());
    if (!isWithinCheckInWindow(event, now)) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Sự kiện đã kết thúc, không thể check-in");
    }
  }

  private boolean isWithinCheckInWindow(Event event, Timestamp now) {
    if (event.getStatus() == EventStatus.CANCELED
        || event.getStatus() == EventStatus.DRAFT
        || event.getStatus() == EventStatus.TEASING) {
      return false;
    }
    if (event.getStatus() != EventStatus.ONSALE && event.getStatus() != EventStatus.ENDED) {
      return false;
    }
    return event.getEndTime() != null && !now.after(event.getEndTime());
  }

  private CheckInResponseDTO resolveOptimisticLockConflict(
      UUID ticketId, Order order, User customer) {
    Ticket latestTicket =
        ticketRepository
            .findById(ticketId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy vé"));
    if (latestTicket.getStatus() == TicketStatus.USED) {
      return toResponse(
          CheckInResultStatus.ALREADY_USED, "Vé đã sử dụng", order, customer, latestTicket);
    }
    throw new AppException(HttpStatus.CONFLICT, "Vé vừa được cập nhật, vui lòng quét lại");
  }

  private CheckInOrderDTO toOrderDTO(Order order) {
    User customer = userRepository.findById(order.getCustomerId()).orElse(null);
    List<Ticket> tickets = ticketRepository.findByOrderId(order.getId());
    Map<UUID, TicketClass> ticketClassById =
        ticketClassRepository.findByEventId(order.getEventId()).stream()
            .collect(Collectors.toMap(TicketClass::getId, Function.identity()));

    return CheckInOrderDTO.builder()
        .orderId(order.getId())
        .orderCode(order.getOrderCode())
        .eventId(order.getEventId())
        .customerId(order.getCustomerId())
        .customerName(customer != null ? customer.getFullName() : null)
        .phone(customer != null ? customer.getPhone() : null)
        .status(order.getStatus())
        .totalAmount(order.getTotalAmount())
        .tickets(
            tickets.stream()
                .sorted(Comparator.comparing(Ticket::getSeatLabel))
                .map(ticket -> toTicketDTO(ticket, ticketClassById.get(ticket.getTicketClassId())))
                .toList())
        .build();
  }

  private CheckInResponseDTO toResponse(
      CheckInResultStatus result, String message, Order order, User customer, Ticket ticket) {
    TicketClass ticketClass =
        ticketClassRepository.findById(ticket.getTicketClassId()).orElse(null);
    CheckInTicketDTO ticketDTO = toTicketDTO(ticket, ticketClass);
    return CheckInResponseDTO.builder()
        .result(result)
        .message(message)
        .orderId(order.getId())
        .orderCode(order.getOrderCode())
        .eventId(order.getEventId())
        .customerId(customer.getId())
        .customerName(customer.getFullName())
        .phone(customer.getPhone())
        .ticket(ticketDTO)
        .checkedAt(ticket.getCheckInTime())
        .checkInBy(ticket.getCheckInBy())
        .checkInByName(ticketDTO.getCheckInByName())
        .build();
  }

  private CheckInTicketDTO toTicketDTO(Ticket ticket, TicketClass ticketClass) {
    User checkInStaff =
        ticket.getCheckInBy() != null
            ? userRepository.findById(ticket.getCheckInBy()).orElse(null)
            : null;
    return CheckInTicketDTO.builder()
        .ticketId(ticket.getId())
        .seatLabel(ticket.getSeatLabel())
        .label(ticket.getSeatLabel())
        .ticketClassId(ticket.getTicketClassId())
        .ticketClassName(ticketClass != null ? ticketClass.getName() : null)
        .price(ticket.getPrice())
        .status(ticket.getStatus())
        .checkInTime(ticket.getCheckInTime())
        .checkInBy(ticket.getCheckInBy())
        .checkInByName(checkInStaff != null ? checkInStaff.getFullName() : null)
        .build();
  }

  private CheckInHistoryDTO toHistoryDTO(Ticket ticket) {
    Order order = orderRepository.findById(ticket.getOrderId()).orElse(null);
    Event event = order != null ? eventRepository.findById(order.getEventId()).orElse(null) : null;
    User customer =
        order != null ? userRepository.findById(order.getCustomerId()).orElse(null) : null;
    User checkInStaff =
        ticket.getCheckInBy() != null
            ? userRepository.findById(ticket.getCheckInBy()).orElse(null)
            : null;
    TicketClass ticketClass =
        ticketClassRepository.findById(ticket.getTicketClassId()).orElse(null);

    return CheckInHistoryDTO.builder()
        .ticketId(ticket.getId())
        .orderId(order != null ? order.getId() : null)
        .orderCode(order != null ? order.getOrderCode() : null)
        .eventId(order != null ? order.getEventId() : null)
        .eventName(event != null ? event.getName() : null)
        .customerId(customer != null ? customer.getId() : null)
        .customerName(customer != null ? customer.getFullName() : null)
        .phone(customer != null ? customer.getPhone() : null)
        .seatLabel(ticket.getSeatLabel())
        .ticketClassId(ticket.getTicketClassId())
        .ticketClassName(ticketClass != null ? ticketClass.getName() : null)
        .price(ticket.getPrice())
        .status(ticket.getStatus())
        .checkInTime(ticket.getCheckInTime())
        .checkInBy(ticket.getCheckInBy())
        .checkInByName(checkInStaff != null ? checkInStaff.getFullName() : null)
        .build();
  }

  private CheckInEventDTO toEventDTO(Event event) {
    return CheckInEventDTO.builder()
        .id(event.getId())
        .name(event.getName())
        .location(event.getLocation())
        .bannerUrl(event.getBannerUrl())
        .startTime(event.getStartTime())
        .endTime(event.getEndTime())
        .status(event.getStatus())
        .build();
  }
}
