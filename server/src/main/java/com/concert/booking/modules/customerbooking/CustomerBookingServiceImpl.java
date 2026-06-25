package com.concert.booking.modules.customerbooking;

import com.concert.booking.common.constants.BankTransferProperties;
import com.concert.booking.common.constants.CheckoutProperties;
import com.concert.booking.common.constants.SePayProperties;
import com.concert.booking.common.constants.VietQrProperties;
import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.customerbooking.dto.CheckoutPaymentStatusDTO;
import com.concert.booking.modules.customerbooking.dto.CheckoutRequestDTO;
import com.concert.booking.modules.customerbooking.dto.CheckoutSessionDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerEventDetailDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerEventSummaryDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerSeatCatalogDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerSeatDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerSelectedSeatDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerTicketClassDTO;
import com.concert.booking.modules.customerbooking.dto.CustomerTicketDTO;
import com.concert.booking.modules.customerbooking.dto.SePayWebhookDTO;
import com.concert.booking.modules.customerbooking.dto.SeatSnapshotDTO;
import com.concert.booking.modules.customerbooking.dto.SeatSummaryDTO;
import com.concert.booking.modules.customerbooking.dto.VietQrPaymentDTO;
import com.concert.booking.modules.customerbooking.kafka.BookingPaidEvent;
import com.concert.booking.modules.customerbooking.redis.CheckoutSessionRedisService;
import com.concert.booking.modules.customerbooking.sepay.SePayWebhookVerifier;
import com.concert.booking.modules.customerbooking.socket.SeatSocketService;
import com.concert.booking.modules.customerbooking.vietqr.VietQrService;
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
import com.concert.booking.modules.order.enums.OrderStatus;
import com.concert.booking.modules.order.enums.PaymentMethod;
import com.concert.booking.modules.order.enums.PaymentStatus;
import com.concert.booking.modules.order.enums.TicketStatus;
import com.concert.booking.modules.order.enums.EmailStatus;
import com.concert.booking.modules.seat.Seat;
import com.concert.booking.modules.seat.SeatHoldService;
import com.concert.booking.modules.seat.SeatRepository;
import com.concert.booking.modules.seat.enums.SeatStatus;
import com.concert.booking.modules.seat.redis.SeatHoldRedisService;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.TicketClassRepository;
import com.concert.booking.modules.ticketmail.TicketDeliveryService;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CustomerBookingServiceImpl implements CustomerBookingService {
  private static final int MAX_ACTIVE_CHECKOUT_SESSIONS = 3;
  private static final String ORDER_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  private static final Pattern VIETQR_REFERENCE_PATTERN = Pattern.compile("MCB-?[A-Z0-9]{8}");
  private static final SecureRandom RANDOM = new SecureRandom();

  EventRepository eventRepository;
  SeatRepository seatRepository;
  TicketClassRepository ticketClassRepository;
  OrderRepository orderRepository;
  PaymentRepository paymentRepository;
  TicketRepository ticketRepository;
  SeatHoldService seatHoldService;
  CheckoutSessionRedisService checkoutSessionRedisService;
  SeatHoldRedisService seatHoldRedisService;
  SeatSocketService seatSocketService;
  BankTransferProperties bankTransferProperties;
  VietQrProperties vietQrProperties;
  SePayProperties sePayProperties;
  CheckoutProperties checkoutProperties;
  VietQrService vietQrService;
  SePayWebhookVerifier sePayWebhookVerifier;
  TicketDeliveryService ticketDeliveryService;

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
    List<UUID> heldSeatIds = seatHoldRedisService.getHeldSeatIds(eventId);

    List<CustomerSeatDTO> seats =
        seatRepository.findByEventId(eventId).stream()
            .sorted(Comparator.comparingInt(Seat::getGridRow).thenComparingInt(Seat::getGridColumn))
            .map(
                seat -> {
                  CustomerSeatDTO dto =
                      toCustomerSeatDTO(seat, ticketClassById.get(seat.getTicketClassId()));
                  if (seat.getStatus() == SeatStatus.AVAILABLE
                      && heldSeatIds.contains(seat.getId())) {
                    dto.setStatus("HELD");
                  }
                  return dto;
                })
            .toList();

    return CustomerSeatCatalogDTO.builder()
        .eventId(event.getId())
        .eventName(event.getName())
        .generatedAt(Instant.now())
        .seats(seats)
        .build();
  }

  @Override
  @Transactional
  public CheckoutSessionDTO checkout(CheckoutRequestDTO checkoutRequest, UUID customerId) {
    if (checkoutRequest.getPaymentMethod() != PaymentMethod.BANK_TRANSFER
        && checkoutRequest.getPaymentMethod() != PaymentMethod.VIETQR) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Phuong thuc thanh toan chua duoc ho tro");
    }

    Event event = getOnSaleEventForBooking(checkoutRequest.getEventId());
    List<UUID> seatIds = checkoutRequest.getSeatIds().stream().distinct().sorted().toList();
    if (seatIds.isEmpty()) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Phai chon it nhat mot ghe");
    }
    List<CheckoutSessionDTO> activeSessions =
        checkoutSessionRedisService.findActiveSessions(event.getId(), customerId);
    for (CheckoutSessionDTO activeSession : activeSessions) {
      List<UUID> activeSeatIds =
          activeSession.getSelectedSeats().stream()
              .map(CustomerSelectedSeatDTO::getId)
              .sorted()
              .toList();
      if (activeSeatIds.equals(seatIds)) {
        return activeSession;
      }
    }
    if (activeSessions.size() >= MAX_ACTIVE_CHECKOUT_SESSIONS) {
      throw new AppException(
          HttpStatus.CONFLICT, "Ban chi co toi da 3 phien thanh toan dang giu ghe cho su kien nay");
    }
    if (seatHoldRedisService.hasAnyHeldSeat(event.getId(), seatIds)) {
      throw new AppException(HttpStatus.CONFLICT, "Mot so ghe vua duoc nguoi khac giu");
    }

    List<Seat> seats = seatHoldService.lockAvailableSeats(event.getId(), seatIds);
    Map<UUID, TicketClass> ticketClassById =
        ticketClassRepository.findByEventId(event.getId()).stream()
            .collect(Collectors.toMap(TicketClass::getId, Function.identity()));
    BigDecimal totalAmount = calculateTotalAmount(seats, ticketClassById);

    UUID paymentSessionId = UUID.randomUUID();
    Instant expiresAt = Instant.now().plus(getCheckoutTtl());
    CheckoutSessionDTO session =
        CheckoutSessionDTO.builder()
            .paymentSessionId(paymentSessionId)
            .customerId(customerId)
            .eventId(event.getId())
            .expiresAt(expiresAt)
            .totalAmount(totalAmount)
            .bankTransferInfo(
                com.concert.booking.modules.customerbooking.dto.BankTransferInfoDTO.builder()
                    .accountNumber(bankTransferProperties.getAccountNumber())
                    .accountName(bankTransferProperties.getAccountName())
                    .amount(totalAmount)
                    .content("MCB " + paymentSessionId.toString().substring(0, 8).toUpperCase())
                    .build())
            .selectedSeats(
                seats.stream()
                    .map(
                        seat ->
                            toSelectedSeatDTO(seat, ticketClassById.get(seat.getTicketClassId())))
                    .toList())
            .build();

    boolean seatsHeld = false;
    try {
      seatHoldRedisService.holdSeats(event.getId(), paymentSessionId, seatIds, getCheckoutTtl());
      seatsHeld = true;
      checkoutSessionRedisService.save(session, getCheckoutTtl());
      checkoutSessionRedisService.addActiveSession(event.getId(), customerId, paymentSessionId);
    } catch (RuntimeException ex) {
      if (seatsHeld) {
        seatHoldRedisService.releaseSeats(event.getId(), seatIds);
      }
      throw ex;
    }

    seatSocketService.emitSeatHeld(event.getId(), seatIds, expiresAt);
    return session;
  }

  @Override
  public CheckoutSessionDTO getCheckoutSession(UUID paymentSessionId, UUID customerId) {
    CheckoutSessionDTO session = getOwnedCheckoutSession(paymentSessionId, customerId);
    List<UUID> seatIds =
        session.getSelectedSeats().stream().map(CustomerSelectedSeatDTO::getId).toList();
    if (!seatHoldRedisService.ownsAllHeldSeats(session.getEventId(), paymentSessionId, seatIds)) {
      checkoutSessionRedisService.delete(paymentSessionId);
      throw new AppException(HttpStatus.GONE, "Phien thanh toan da het han");
    }
    return session;
  }

  @Override
  public void releaseCheckout(UUID paymentSessionId, UUID customerId) {
    CheckoutSessionDTO session = getOwnedCheckoutSession(paymentSessionId, customerId);
    List<UUID> seatIds =
        session.getSelectedSeats().stream().map(CustomerSelectedSeatDTO::getId).toList();
    seatHoldRedisService.releaseSeats(session.getEventId(), seatIds);
    checkoutSessionRedisService.delete(paymentSessionId);
    checkoutSessionRedisService.deleteActiveSession(
        session.getEventId(), customerId, paymentSessionId);
    seatSocketService.emitSeatReleased(session.getEventId(), seatIds);
  }

  @Override
  @Transactional
  public OrderResponseDTO confirmPaymentSessionDev(UUID paymentSessionId, UUID customerId) {
    return completePaidCheckoutSession(
        paymentSessionId, customerId, PaymentMethod.BANK_TRANSFER, null);
  }

  @Override
  public VietQrPaymentDTO createVietQrPayment(UUID paymentSessionId, UUID customerId) {
    CheckoutSessionDTO session = getOwnedCheckoutSession(paymentSessionId, customerId);
    ensureSessionStillOwnsSeats(session);

    String reference = vietQrService.createPaymentReference(paymentSessionId);
    vietQrService.savePaymentReference(reference, paymentSessionId, getCheckoutTtl());
    String paymentContent = buildSePayPaymentContent(reference);

    return VietQrPaymentDTO.builder()
        .qrUrl(vietQrService.buildQrUrl(session.getTotalAmount(), paymentContent))
        .bankId(vietQrProperties.getBankId())
        .accountNo(vietQrProperties.getAccountNo())
        .accountName(vietQrProperties.getAccountName())
        .amount(session.getTotalAmount())
        .content(paymentContent)
        .expiredAt(session.getExpiresAt())
        .build();
  }

  @Override
  @Transactional(readOnly = true)
  public CheckoutPaymentStatusDTO getCheckoutPaymentStatus(UUID paymentSessionId, UUID customerId) {
    String reference = vietQrService.createPaymentReference(paymentSessionId);
    Payment payment = paymentRepository.findByTransactionRef(reference).orElse(null);
    if (payment != null) {
      Order order = getOwnedOrder(payment.getOrderId(), customerId);
      return checkoutPaymentStatus("PAID", payment.getPaymentMethod(), order.getId());
    }

    CheckoutSessionDTO session =
        checkoutSessionRedisService.findById(paymentSessionId).orElse(null);
    if (session == null
        || session.getExpiresAt() == null
        || !session.getExpiresAt().isAfter(Instant.now())) {
      return checkoutPaymentStatus("EXPIRED", PaymentMethod.VIETQR, null);
    }
    if (!customerId.equals(session.getCustomerId())) {
      throw new AppException(
          HttpStatus.FORBIDDEN, "Ban khong co quyen truy cap phien thanh toan nay");
    }
    return checkoutPaymentStatus("PENDING", PaymentMethod.VIETQR, null);
  }

  @Override
  @Transactional
  public Map<String, Boolean> handleSePayWebhook(
      String authorizationHeader, SePayWebhookDTO payload) {
    if (!sePayWebhookVerifier.verify(authorizationHeader)) {
      throw new AppException(HttpStatus.UNAUTHORIZED, "SePay webhook khong hop le");
    }
    if (payload == null) {
      return Map.of("success", true);
    }
    if (!"in".equalsIgnoreCase(payload.getTransferType())) {
      return Map.of("success", true);
    }
    if (sePayProperties.getMerchantAccount() != null
        && !sePayProperties.getMerchantAccount().isBlank()
        && !sePayProperties.getMerchantAccount().equals(payload.getAccountNumber())) {
      return Map.of("success", true);
    }

    // Lock/Mark webhook as processed in Redis at the very beginning of processing
    boolean marked = vietQrService.markSePayWebhookProcessed(payload.getId());
    if (!marked) {
      log.info("SePay webhook already processed or in progress: {}", payload.getId());
      return Map.of("success", true);
    }

    // Register synchronization to remove the Redis lock in case of rollback
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
      TransactionSynchronizationManager.registerSynchronization(
          new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
              if (status == TransactionSynchronization.STATUS_ROLLED_BACK) {
                log.warn("SePay webhook transaction rolled back; removing Redis mark for sePayId={}", payload.getId());
                vietQrService.deleteSePayWebhookProcessed(payload.getId());
              }
            }
          });
    }

    String reference = parseVietQrReference(payload);
    if (reference == null) {
      return Map.of("success", true);
    }
    if (paymentRepository.findByTransactionRef(reference).isPresent()) {
      return Map.of("success", true);
    }

    UUID paymentSessionId = vietQrService.findPaymentSessionId(reference).orElse(null);
    if (paymentSessionId == null) {
      return Map.of("success", true);
    }

    CheckoutSessionDTO session =
        checkoutSessionRedisService.findById(paymentSessionId).orElse(null);
    if (session == null
        || session.getExpiresAt() == null
        || !session.getExpiresAt().isAfter(Instant.now())) {
      log.warn(
          "SePay money received for expired checkout. reference={}, sePayId={}, amount={}",
          reference,
          payload.getId(),
          payload.getTransferAmount());
      return Map.of("success", true);
    }
    if (payload.getTransferAmount() == null
        || session.getTotalAmount().compareTo(payload.getTransferAmount()) != 0) {
      log.warn(
          "SePay amount mismatch. reference={}, expected={}, actual={}, sePayId={}",
          reference,
          session.getTotalAmount(),
          payload.getTransferAmount(),
          payload.getId());
      return Map.of("success", true);
    }

    completePaidCheckoutSession(
        paymentSessionId, session.getCustomerId(), PaymentMethod.VIETQR, reference);
    return Map.of("success", true);
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
        .map(
            ticket -> {
              Order order = getOwnedOrder(ticket.getOrderId(), customerId);
              Event event =
                  eventRepository
                      .findById(order.getEventId())
                      .orElseThrow(
                          () -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay su kien"));
              TicketClass ticketClass =
                  ticketClassRepository.findById(ticket.getTicketClassId()).orElse(null);
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
        .heldSeatIds(seatHoldRedisService.getHeldSeatIds(eventId))
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
      return "";
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

  private CheckoutSessionDTO getOwnedCheckoutSession(UUID paymentSessionId, UUID customerId) {
    CheckoutSessionDTO session =
        checkoutSessionRedisService
            .findById(paymentSessionId)
            .orElseThrow(() -> new AppException(HttpStatus.GONE, "Phien thanh toan da het han"));
    if (!customerId.equals(session.getCustomerId())) {
      throw new AppException(
          HttpStatus.FORBIDDEN, "Ban khong co quyen truy cap phien thanh toan nay");
    }
    if (session.getExpiresAt() == null || !session.getExpiresAt().isAfter(Instant.now())) {
      checkoutSessionRedisService.delete(paymentSessionId);
      throw new AppException(HttpStatus.GONE, "Phien thanh toan da het han");
    }
    return session;
  }

  private void ensureSessionStillOwnsSeats(CheckoutSessionDTO session) {
    List<UUID> seatIds =
        session.getSelectedSeats().stream().map(CustomerSelectedSeatDTO::getId).toList();
    if (!seatHoldRedisService.ownsAllHeldSeats(
        session.getEventId(), session.getPaymentSessionId(), seatIds)) {
      checkoutSessionRedisService.delete(session.getPaymentSessionId());
      throw new AppException(HttpStatus.GONE, "Phien thanh toan da het han");
    }
  }

  private OrderResponseDTO completePaidCheckoutSession(
      UUID paymentSessionId, UUID customerId, PaymentMethod paymentMethod, String transactionRef) {
    if (transactionRef != null && !transactionRef.isBlank()) {
      Payment existingPayment = paymentRepository.findByTransactionRef(transactionRef).orElse(null);
      if (existingPayment != null) {
        Order existingOrder = getOwnedOrder(existingPayment.getOrderId(), customerId);
        List<Ticket> existingTickets = ticketRepository.findByOrderId(existingOrder.getId());
        Map<UUID, TicketClass> existingTicketClassById =
            ticketClassRepository.findByEventId(existingOrder.getEventId()).stream()
                .collect(Collectors.toMap(TicketClass::getId, Function.identity()));
        return toOrderResponse(
            existingOrder, existingPayment, existingTickets, existingTicketClassById);
      }
    }

    CheckoutSessionDTO session = getOwnedCheckoutSession(paymentSessionId, customerId);
    ensureSessionStillOwnsSeats(session);

    List<UUID> seatIds =
        session.getSelectedSeats().stream().map(CustomerSelectedSeatDTO::getId).toList();
    Event event = getOnSaleEventForBooking(session.getEventId());
    List<Seat> seats = seatHoldService.lockAvailableSeatsWithoutRedisCheck(event.getId(), seatIds);
    Map<UUID, TicketClass> ticketClassById =
        ticketClassRepository.findByEventId(event.getId()).stream()
            .collect(Collectors.toMap(TicketClass::getId, Function.identity()));
    BigDecimal totalAmount = calculateTotalAmount(seats, ticketClassById);

    Order order =
        orderRepository.save(
            Order.builder()
                .orderCode(generateOrderCode())
                .eventId(event.getId())
                .customerId(customerId)
                .staffId(customerId)
                .totalAmount(totalAmount)
                .status(OrderStatus.PAID)
                .emailStatus(EmailStatus.UNSENT)
                .createdBy(customerId)
                .build());

    Payment payment =
        paymentRepository.save(
            Payment.builder()
                .orderId(order.getId())
                .transactionRef(transactionRef)
                .amount(totalAmount)
                .amountReceived(totalAmount)
                .paymentMethod(paymentMethod)
                .status(PaymentStatus.CONFIRMED)
                .createdBy(customerId)
                .build());

    List<Ticket> tickets =
        seats.stream()
            .<Ticket>map(
                seat -> {
                  TicketClass ticketClass = ticketClassById.get(seat.getTicketClassId());
                  return Ticket.builder()
                      .orderId(order.getId())
                      .seatId(seat.getId())
                      .ticketClassId(ticketClass.getId())
                      .seatLabel(toSeatLabel(seat))
                      .price(ticketClass.getPrice())
                      .status(TicketStatus.UNUSED)
                      .createdBy(customerId)
                      .build();
                })
            .toList();

    seatHoldService.confirmSold(seats, customerId);
    ticketRepository.saveAll(tickets);
    UUID eventId = event.getId();
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
      TransactionSynchronizationManager.registerSynchronization(
          new TransactionSynchronization() {
            @Override
            public void afterCommit() {
              seatHoldRedisService.releaseSeats(eventId, seatIds);
              checkoutSessionRedisService.delete(paymentSessionId);
              checkoutSessionRedisService.deleteActiveSession(eventId, customerId, paymentSessionId);
              seatSocketService.emitSeatSold(eventId, seatIds);
            }
          });
    } else {
      seatHoldRedisService.releaseSeats(eventId, seatIds);
      checkoutSessionRedisService.delete(paymentSessionId);
      checkoutSessionRedisService.deleteActiveSession(eventId, customerId, paymentSessionId);
      seatSocketService.emitSeatSold(eventId, seatIds);
    }

    OrderResponseDTO response = toOrderResponse(order, payment, tickets, ticketClassById);
    deliverTicketsAfterCommit(response, payment.getTransactionRef(), seatIds);
    return response;
  }

  private void deliverTicketsAfterCommit(
      OrderResponseDTO order, String transactionRef, List<UUID> seatIds) {
    BookingPaidEvent event =
        new BookingPaidEvent(
            order.getOrderId(),
            order.getOrderCode(),
            order.getCustomerId(),
            order.getEventId(),
            order.getTotalAmount(),
            order.getPaymentMethod(),
            transactionRef,
            seatIds,
            Instant.now());

    ticketDeliveryService.deliverTicketsAfterCommit(event);
  }

  private CheckoutPaymentStatusDTO checkoutPaymentStatus(
      String status, PaymentMethod paymentMethod, UUID orderId) {
    return CheckoutPaymentStatusDTO.builder()
        .status(status)
        .paymentMethod(paymentMethod)
        .orderId(orderId)
        .build();
  }

  private String parseVietQrReference(SePayWebhookDTO payload) {
    String reference = findVietQrReference(payload.getCode());
    if (reference != null) {
      return reference;
    }
    reference = findVietQrReference(payload.getContent());
    if (reference != null) {
      return reference;
    }
    return findVietQrReference(payload.getDescription());
  }

  private String buildSePayPaymentContent(String reference) {
    String prefix = sePayProperties.getPaymentPrefix();
    if (prefix == null || prefix.isBlank()) {
      return reference;
    }
    return prefix.trim() + " " + reference;
  }

  private String findVietQrReference(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    Matcher matcher = VIETQR_REFERENCE_PATTERN.matcher(value.toUpperCase());
    if (!matcher.find()) {
      return null;
    }
    String rawReference = matcher.group();
    return rawReference.startsWith("MCB-")
        ? rawReference
        : "MCB-" + rawReference.substring("MCB".length());
  }

  private BigDecimal calculateTotalAmount(
      List<Seat> seats, Map<UUID, TicketClass> ticketClassById) {
    return seats.stream()
        .map(
            seat -> {
              TicketClass ticketClass = ticketClassById.get(seat.getTicketClassId());
              if (ticketClass == null) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Hang ve cua ghe khong hop le");
              }
              return ticketClass.getPrice();
            })
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  private CustomerSelectedSeatDTO toSelectedSeatDTO(Seat seat, TicketClass ticketClass) {
    if (ticketClass == null) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Hang ve cua ghe khong hop le");
    }
    return CustomerSelectedSeatDTO.builder()
        .id(seat.getId())
        .label(toSeatLabel(seat))
        .ticketClassId(ticketClass.getId())
        .ticketClassName(ticketClass.getName())
        .price(ticketClass.getPrice())
        .build();
  }

  private String generateOrderCode() {
    String code;
    do {
      StringBuilder builder = new StringBuilder("O");
      for (int i = 0; i < 7; i++) {
        builder.append(ORDER_CODE_CHARS.charAt(RANDOM.nextInt(ORDER_CODE_CHARS.length())));
      }
      code = builder.toString();
    } while (orderRepository.existsByOrderCode(code));
    return code;
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
        .amountReceived(
            payment.getAmountReceived() != null ? payment.getAmountReceived() : payment.getAmount())
        .items(
            tickets.stream()
                .map(
                    ticket ->
                        toTicketResponse(ticket, ticketClassById.get(ticket.getTicketClassId())))
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

  private Duration getCheckoutTtl() {
    return Duration.ofMinutes(checkoutProperties.getHoldTtlMinutes());
  }
}
