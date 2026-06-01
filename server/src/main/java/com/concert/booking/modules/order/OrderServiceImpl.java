package com.concert.booking.modules.order;

import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.event.Event;
import com.concert.booking.modules.event.EventRepository;
import com.concert.booking.modules.event.enums.EventStatus;
import com.concert.booking.modules.order.dto.*;
import com.concert.booking.modules.order.enums.OrderStatus;
import com.concert.booking.modules.order.enums.PaymentMethod;
import com.concert.booking.modules.order.enums.PaymentStatus;
import com.concert.booking.modules.order.enums.TicketStatus;
import com.concert.booking.modules.seat.Seat;
import com.concert.booking.modules.seat.SeatHoldService;
import com.concert.booking.modules.seat.SeatRepository;
import com.concert.booking.modules.seat.enums.SeatStatus;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.TicketClassRepository;
import com.concert.booking.modules.user.User;
import com.concert.booking.modules.user.UserRepository;
import com.concert.booking.modules.user.enums.AuthProvider;
import com.concert.booking.modules.user.enums.UserRole;
import com.concert.booking.modules.user.enums.UserStatus;
import java.math.BigDecimal;
import java.security.SecureRandom;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderServiceImpl implements OrderService {
  private static final String ORDER_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  private static final SecureRandom RANDOM = new SecureRandom();

  OrderRepository orderRepository;
  PaymentRepository paymentRepository;
  TicketRepository ticketRepository;
  EventRepository eventRepository;
  SeatRepository seatRepository;
  SeatHoldService seatHoldService;
  TicketClassRepository ticketClassRepository;
  UserRepository userRepository;

  @Override
  @Transactional(readOnly = true)
  public CustomerLookupDTO lookupCustomerByPhone(String phone) {
    if (phone == null || phone.isBlank()) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Số điện thoại không được để trống");
    }

    return userRepository
        .findByPhone(phone.trim())
        .map(
            user ->
                CustomerLookupDTO.builder()
                    .found(true)
                    .customerId(user.getId())
                    .phone(user.getPhone())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .onlineVerified(user.getOnlineVerified())
                    .build())
        .orElseGet(() -> CustomerLookupDTO.builder().found(false).phone(phone.trim()).build());
  }

  @Override
  @Transactional
  public List<Event> getOnSaleEvents() {
    ensureDemoEventExists();
    Timestamp now = Timestamp.from(Instant.now());
    return eventRepository.findByStatus(EventStatus.ONSALE).stream()
        .filter(event -> event.getStartTime() == null || event.getStartTime().after(now))
        .sorted(Comparator.comparing(Event::getStartTime))
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public SeatCatalogDTO getSeatCatalog(UUID eventId) {
    Event event = getEventForSale(eventId);
    List<TicketClass> ticketClasses = ticketClassRepository.findByEventId(eventId);
    Map<UUID, TicketClass> ticketClassById =
        ticketClasses.stream().collect(Collectors.toMap(TicketClass::getId, Function.identity()));

    List<OrderItemResponseDTO> seats =
        seatRepository.findByEventId(eventId).stream()
            .sorted(Comparator.comparingInt(Seat::getGridRow).thenComparingInt(Seat::getGridColumn))
            .map(seat -> toSeatCatalogItem(seat, ticketClassById.get(seat.getTicketClassId())))
            .toList();

    return SeatCatalogDTO.builder()
        .eventId(event.getId())
        .eventName(event.getName())
        .ticketClasses(ticketClasses.stream().map(this::toTicketClassDTO).toList())
        .seats(seats)
        .build();
  }

  @Override
  @Transactional
  public OrderResponseDTO createOrder(OrderCreateDTO request, UUID staffId) {
    if (staffId == null) {
      throw new AppException(HttpStatus.UNAUTHORIZED, "Không xác định được nhân viên bán vé");
    }
    validateSupportedPayment(request.getPayment().getPaymentMethod());

    Event event = getEventForSale(request.getEventId());
    List<UUID> distinctSeatIds = request.getSeatIds().stream().distinct().sorted().toList();
    if (distinctSeatIds.isEmpty()) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Phải chọn ít nhất một ghế");
    }
    if (distinctSeatIds.size() > 10) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Một đơn hàng chỉ được chọn tối đa 10 ghế");
    }
    List<Seat> seats = seatHoldService.lockAvailableSeats(event.getId(), distinctSeatIds);

    Map<UUID, TicketClass> ticketClassById =
        ticketClassRepository.findByEventId(event.getId()).stream()
            .collect(Collectors.toMap(TicketClass::getId, Function.identity()));

    BigDecimal totalAmount = calculateTotalAmount(seats, ticketClassById);
    validateManualPayment(request, totalAmount);
    User customer = findOrCreatePosCustomer(request, staffId);

    Order order =
        orderRepository.save(
            Order.builder()
                .orderCode(generateOrderCode())
                .eventId(event.getId())
                .customerId(customer.getId())
                .staffId(staffId)
                .totalAmount(totalAmount)
                .status(OrderStatus.PAID)
                .createdBy(staffId)
                .build());

    Payment payment =
        paymentRepository.save(
            Payment.builder()
                .orderId(order.getId())
                .amount(totalAmount)
                .amountReceived(request.getPayment().getAmountReceived())
                .paymentMethod(request.getPayment().getPaymentMethod())
                .status(PaymentStatus.CONFIRMED)
                .createdBy(staffId)
                .build());

    List<Ticket> tickets =
        seats.stream()
            .map(
                seat -> {
                  TicketClass ticketClass = ticketClassById.get(seat.getTicketClassId());
                  Ticket ticket = Ticket.builder()
                      .orderId(order.getId())
                      .seatId(seat.getId())
                      .ticketClassId(ticketClass.getId())
                      .seatLabel(toSeatLabel(seat))
                      .price(ticketClass.getPrice())
                      .status(TicketStatus.UNUSED)
                      .createdBy(staffId)
                      .build();
                  return ticket;
                })
            .toList();

    seatHoldService.confirmSold(seats, staffId);
    ticketRepository.saveAll(tickets);

    return toOrderResponse(order, payment, tickets, ticketClassById);
  }

  @Override
  @Transactional(readOnly = true)
  public OrderResponseDTO getPosOrderByCode(String orderCode) {
    if (orderCode == null || orderCode.isBlank()) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Mã đơn hàng không được để trống");
    }

    Order order =
        orderRepository
            .findByOrderCode(orderCode.trim())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
    Payment payment =
        paymentRepository
            .findByOrderId(order.getId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy thanh toán"));
    List<Ticket> tickets = ticketRepository.findByOrderId(order.getId());
    Map<UUID, TicketClass> ticketClassById =
        ticketClassRepository.findByEventId(order.getEventId()).stream()
            .collect(Collectors.toMap(TicketClass::getId, Function.identity()));

    return toOrderResponse(order, payment, tickets, ticketClassById);
  }

  @Override
  @Transactional
  public OrderResponseDTO handlePaymentWebhook(PaymentWebhookDTO request) {
    Order order =
        orderRepository
            .findByOrderCode(request.getOrderCode())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
    Payment payment =
        paymentRepository
            .findByOrderId(order.getId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy thanh toán"));

    if (payment.getPaymentMethod() != PaymentMethod.VNPAY) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Đơn hàng không thanh toán qua VNPay");
    }

    payment.setTransactionRef(request.getTransactionRef());
    payment.setAmount(request.getAmount() != null ? request.getAmount() : payment.getAmount());
    payment.setStatus(Boolean.TRUE.equals(request.getSuccess()) ? PaymentStatus.CONFIRMED : PaymentStatus.FAILED);
    paymentRepository.save(payment);

    List<Ticket> tickets = ticketRepository.findByOrderId(order.getId());
    Map<UUID, TicketClass> ticketClassById =
        ticketClassRepository.findByEventId(order.getEventId()).stream()
            .collect(Collectors.toMap(TicketClass::getId, Function.identity()));
    return toOrderResponse(order, payment, tickets, ticketClassById);
  }

  private Event getEventForSale(UUID eventId) {
    Event event =
        eventRepository
            .findById(eventId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện"));
    if (event.getStatus() != EventStatus.ONSALE) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Sự kiện chưa mở bán");
    }
    Timestamp now = Timestamp.from(Instant.now());
    if (event.getStartTime() != null && !event.getStartTime().after(now)) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Sự kiện đã bắt đầu, không thể bán vé");
    }
    return event;
  }

  private void ensureDemoEventExists() {
    if (!eventRepository.findAll().isEmpty()) {
      return;
    }

    Timestamp now = Timestamp.from(Instant.now());
    Event event =
        eventRepository.save(
            Event.builder()
                .name("POS Demo Concert")
                .location("Box Office Demo Hall")
                .teasingTime(now)
                .openTime(now)
                .startTime(Timestamp.from(Instant.now().plusSeconds(3600)))
                .endTime(Timestamp.from(Instant.now().plusSeconds(10800)))
                .status(EventStatus.ONSALE)
                .build());

    TicketClass general =
        ticketClassRepository.save(
            TicketClass.builder()
                .eventId(event.getId())
                .name("General Admission")
                .colorCode("#4f46e5")
                .price(BigDecimal.valueOf(150000))
                .build());
    TicketClass vip =
        ticketClassRepository.save(
            TicketClass.builder()
                .eventId(event.getId())
                .name("VIP Backstage")
                .colorCode("#9333ea")
                .price(BigDecimal.valueOf(350000))
                .build());

    List<Seat> demoSeats =
        List.of(
            demoSeat(event.getId(), vip.getId(), 0, 0),
            demoSeat(event.getId(), vip.getId(), 0, 1),
            demoSeat(event.getId(), vip.getId(), 0, 2),
            demoSeat(event.getId(), vip.getId(), 0, 3),
            demoSeat(event.getId(), general.getId(), 1, 0),
            demoSeat(event.getId(), general.getId(), 1, 1),
            demoSeat(event.getId(), general.getId(), 1, 2),
            demoSeat(event.getId(), general.getId(), 1, 3),
            demoSeat(event.getId(), general.getId(), 1, 4),
            demoSeat(event.getId(), general.getId(), 1, 5));
    seatRepository.saveAll(demoSeats);
  }

  private Seat demoSeat(UUID eventId, UUID ticketClassId, int row, int column) {
    return Seat.builder()
        .eventId(eventId)
        .ticketClassId(ticketClassId)
        .gridRow(row)
        .gridColumn(column)
        .label((char) ('A' + row) + String.valueOf(column + 1))
        .status(SeatStatus.AVAILABLE)
        .build();
  }

  private void validateSupportedPayment(PaymentMethod method) {
    if (method == PaymentMethod.VNPAY || method == PaymentMethod.VIETQR) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Phương thức thanh toán này chưa hỗ trợ tạo đơn POS");
    }
  }

  private BigDecimal calculateTotalAmount(List<Seat> seats, Map<UUID, TicketClass> ticketClassById) {
    return seats.stream()
        .map(
            seat -> {
              TicketClass ticketClass = ticketClassById.get(seat.getTicketClassId());
              if (ticketClass == null) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Hạng vé của ghế không hợp lệ");
              }
              return ticketClass.getPrice();
            })
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  private void validateManualPayment(OrderCreateDTO request, BigDecimal totalAmount) {
    BigDecimal amountReceived = request.getPayment().getAmountReceived();
    if (amountReceived == null || amountReceived.compareTo(totalAmount) < 0) {
      throw new AppException(
          HttpStatus.BAD_REQUEST, "Số tiền thực nhận chưa đủ để xác nhận thanh toán");
    }
  }

  private User findOrCreatePosCustomer(OrderCreateDTO request, UUID staffId) {
    return userRepository
        .findByPhone(request.getPhone().trim())
        .map(
            existingUser -> {
              existingUser.setFullName(request.getFullName().trim());
              if (request.getEmail() != null && !request.getEmail().isBlank()) {
                userRepository
                    .findByEmail(request.getEmail().trim())
                    .filter(user -> !user.getId().equals(existingUser.getId()))
                    .ifPresent(
                        user -> {
                          throw new AppException(
                              HttpStatus.CONFLICT, "Email đã được dùng bởi khách hàng khác");
                        });
                existingUser.setEmail(request.getEmail().trim());
              }
              existingUser.setUpdatedBy(staffId);
              return userRepository.save(existingUser);
            })
        .orElseGet(
            () -> {
              String email =
                  request.getEmail() == null || request.getEmail().isBlank()
                      ? null
                      : request.getEmail().trim();
              if (email != null && userRepository.existsByEmail(email)) {
                throw new AppException(
                    HttpStatus.CONFLICT, "Email đã được dùng bởi khách hàng khác");
              }

              return userRepository.save(
                  User.builder()
                      .phone(request.getPhone().trim())
                      .fullName(request.getFullName().trim())
                      .email(email)
                      .role(UserRole.CUSTOMER)
                      .authProvider(AuthProvider.LOCAL)
                      .status(UserStatus.ACTIVE)
                      .onlineVerified(false)
                      .createdBy(staffId)
                      .build());
            });
  }

  private String generateOrderCode() {
    String code;
    do {
      int length = 8 + RANDOM.nextInt(3);
      StringBuilder builder = new StringBuilder(length);
      for (int i = 0; i < length; i++) {
        builder.append(ORDER_CODE_CHARS.charAt(RANDOM.nextInt(ORDER_CODE_CHARS.length())));
      }
      code = builder.toString();
    } while (orderRepository.existsByOrderCode(code));
    return code;
  }

  private SeatCatalogDTO.TicketClassDTO toTicketClassDTO(TicketClass ticketClass) {
    return SeatCatalogDTO.TicketClassDTO.builder()
        .id(ticketClass.getId())
        .name(ticketClass.getName())
        .colorCode(ticketClass.getColorCode())
        .price(ticketClass.getPrice())
        .build();
  }

  private OrderItemResponseDTO toSeatCatalogItem(Seat seat, TicketClass ticketClass) {
    return OrderItemResponseDTO.builder()
        .id(seat.getId())
        .seatId(seat.getId())
        .ticketClassId(seat.getTicketClassId())
        .ticketClassName(ticketClass != null ? ticketClass.getName() : "Unknown")
        .price(ticketClass != null ? ticketClass.getPrice() : BigDecimal.ZERO)
        .gridRow(seat.getGridRow())
        .gridColumn(seat.getGridColumn())
        .seatLabel(toSeatLabel(seat))
        .seatStatus(seat.getStatus())
        .label(toSeatLabel(seat))
        .status(seat.getStatus())
        .ticketClass(toTicketClassInfo(ticketClass))
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

  private OrderResponseDTO toOrderResponse(
      Order order, Payment payment, List<Ticket> tickets, Map<UUID, TicketClass> ticketClassById) {
    return OrderResponseDTO.builder()
        .orderId(order.getId())
        .orderCode(order.getOrderCode())
        .customerId(order.getCustomerId())
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

  private String toSeatLabel(Seat seat) {
    if (seat.getLabel() != null && !seat.getLabel().isBlank()) {
      return seat.getLabel();
    }
    return (char) ('A' + seat.getGridRow()) + String.valueOf(seat.getGridColumn() + 1);
  }
}
