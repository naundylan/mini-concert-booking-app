package com.concert.booking.modules.booking;

import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.booking.dto.*;
import com.concert.booking.modules.booking.enums.BookingStatus;
import com.concert.booking.modules.booking.enums.PaymentMethod;
import com.concert.booking.modules.booking.enums.PaymentStatus;
import com.concert.booking.modules.event.Event;
import com.concert.booking.modules.event.EventRepository;
import com.concert.booking.modules.event.enums.EventStatus;
import com.concert.booking.modules.seat.Seat;
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
public class BookingServiceImpl implements BookingService {
  private static final String BOOKING_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  private static final SecureRandom RANDOM = new SecureRandom();

  BookingRepository bookingRepository;
  BookingItemRepository bookingItemRepository;
  EventRepository eventRepository;
  SeatRepository seatRepository;
  TicketClassRepository ticketClassRepository;
  UserRepository userRepository;

  @Override
  @Transactional(readOnly = true)
  public PosCustomerLookupResponse lookupCustomerByPhone(String phone) {
    if (phone == null || phone.isBlank()) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Số điện thoại không được để trống");
    }

    return userRepository
        .findByPhone(phone.trim())
        .map(
            user ->
                PosCustomerLookupResponse.builder()
                    .found(true)
                    .customerId(user.getId())
                    .phone(user.getPhone())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .onlineVerified(user.getOnlineVerified())
                    .build())
        .orElseGet(
            () ->
                PosCustomerLookupResponse.builder().found(false).phone(phone.trim()).build());
  }

  @Override
  @Transactional(readOnly = true)
  public List<PosEventResponse> getOnSaleEvents() {
    return eventRepository.findByStatus(EventStatus.ONSALE).stream()
        .sorted(Comparator.comparing(Event::getStartTime))
        .map(
            event ->
                PosEventResponse.builder()
                    .id(event.getId())
                    .name(event.getName())
                    .location(event.getLocation())
                    .bannerUrl(event.getBannerUrl())
                    .startTime(event.getStartTime())
                    .status(event.getStatus())
                    .build())
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public PosCatalogResponse getCatalog(UUID eventId) {
    Event event = getEventForSale(eventId);
    List<TicketClass> ticketClasses = ticketClassRepository.findByEventId(eventId);
    Map<UUID, TicketClass> ticketClassById =
        ticketClasses.stream().collect(Collectors.toMap(TicketClass::getId, Function.identity()));

    List<PosSeatResponse> seats =
        seatRepository.findByEventId(eventId).stream()
            .sorted(Comparator.comparingInt(Seat::getGridRow).thenComparingInt(Seat::getGridColumn))
            .map(seat -> toSeatResponse(seat, ticketClassById.get(seat.getTicketClassId())))
            .toList();

    return PosCatalogResponse.builder()
        .eventId(event.getId())
        .eventName(event.getName())
        .ticketClasses(ticketClasses.stream().map(this::toTicketClassResponse).toList())
        .seats(seats)
        .build();
  }

  @Override
  @Transactional
  public PosBookingResponse createPosBooking(PosBookingCreateRequest request, UUID staffId) {
    if (staffId == null) {
      throw new AppException(HttpStatus.UNAUTHORIZED, "Không xác định được nhân viên bán vé");
    }

    Event event = getEventForSale(request.getEventId());
    List<UUID> distinctSeatIds = request.getSeatIds().stream().distinct().toList();
    List<Seat> seats = seatRepository.findAllByIdForUpdate(distinctSeatIds);
    if (seats.size() != distinctSeatIds.size()) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Danh sách ghế không hợp lệ");
    }

    for (Seat seat : seats) {
      if (!event.getId().equals(seat.getEventId())) {
        throw new AppException(HttpStatus.BAD_REQUEST, "Ghế không thuộc sự kiện đang bán");
      }
      if (seat.getStatus() != SeatStatus.AVAILABLE) {
        throw new AppException(HttpStatus.CONFLICT, "Một hoặc nhiều ghế đã được giữ hoặc đã bán");
      }
    }

    Map<UUID, TicketClass> ticketClassById =
        ticketClassRepository.findByEventId(event.getId()).stream()
            .collect(Collectors.toMap(TicketClass::getId, Function.identity()));

    BigDecimal totalAmount =
        seats.stream()
            .<BigDecimal>map(
                seat -> {
                  TicketClass ticketClass = ticketClassById.get(seat.getTicketClassId());
                  if (ticketClass == null) {
                    throw new AppException(HttpStatus.BAD_REQUEST, "Hạng vé của ghế không hợp lệ");
                  }
                  return ticketClass.getPrice();
                })
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    validatePayment(request, totalAmount);
    User customer = findOrCreatePosCustomer(request, staffId);
    String bookingCode = generateBookingCode();
    boolean gatewayPayment = request.getPaymentMethod() == PaymentMethod.VNPAY;

    Booking booking =
        Booking.builder()
            .bookingCode(bookingCode)
            .eventId(event.getId())
            .customerId(customer.getId())
            .staffId(staffId)
            .customerPhone(customer.getPhone())
            .customerName(customer.getFullName())
            .customerEmail(customer.getEmail())
            .totalAmount(totalAmount)
            .amountReceived(gatewayPayment ? null : request.getAmountReceived())
            .paymentMethod(request.getPaymentMethod())
            .paymentStatus(
                gatewayPayment ? PaymentStatus.WAITING_GATEWAY : PaymentStatus.CONFIRMED)
            .status(gatewayPayment ? BookingStatus.PENDING_PAYMENT : BookingStatus.PAID)
            .createdBy(staffId)
            .build();
    booking = bookingRepository.save(booking);

    Booking savedBooking = booking;
    List<BookingItem> items =
        seats.stream()
            .map(
                seat -> {
                  TicketClass ticketClass = ticketClassById.get(seat.getTicketClassId());
                  seat.setStatus(gatewayPayment ? SeatStatus.LOCKED : SeatStatus.SOLD);
                  seat.setUpdatedBy(staffId);
                  BookingItem item = BookingItem.builder()
                      .bookingId(savedBooking.getId())
                      .seatId(seat.getId())
                      .ticketClassId(ticketClass.getId())
                      .seatLabel(toSeatLabel(seat))
                      .price(ticketClass.getPrice())
                      .createdBy(staffId)
                      .build();
                  return item;
                })
            .toList();

    seatRepository.saveAll(seats);
    bookingItemRepository.saveAll(items);

    return toBookingResponse(
        booking,
        items,
        gatewayPayment ? "/payments/vnpay/mock?bookingCode=" + booking.getBookingCode() : null);
  }

  @Override
  @Transactional
  public PosBookingResponse handleVnpayWebhook(VnpayWebhookRequest request) {
    Booking booking =
        bookingRepository
            .findByBookingCode(request.getBookingCode())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));

    if (booking.getPaymentMethod() != PaymentMethod.VNPAY) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Đơn hàng không thanh toán qua VNPay");
    }

    List<BookingItem> items = bookingItemRepository.findByBookingId(booking.getId());
    List<Seat> seats = seatRepository.findAllByIdForUpdate(items.stream().map(BookingItem::getSeatId).toList());

    if (Boolean.TRUE.equals(request.getSuccess())) {
      booking.setStatus(BookingStatus.PAID);
      booking.setPaymentStatus(PaymentStatus.CONFIRMED);
      booking.setAmountReceived(request.getAmount() != null ? request.getAmount() : booking.getTotalAmount());
      seats.forEach(seat -> seat.setStatus(SeatStatus.SOLD));
    } else {
      booking.setStatus(BookingStatus.CANCELED);
      booking.setPaymentStatus(PaymentStatus.FAILED);
      seats.forEach(seat -> seat.setStatus(SeatStatus.AVAILABLE));
    }

    seatRepository.saveAll(seats);
    bookingRepository.save(booking);
    return toBookingResponse(booking, items, null);
  }

  private Event getEventForSale(UUID eventId) {
    Event event =
        eventRepository
            .findById(eventId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện"));
    if (event.getStatus() != EventStatus.ONSALE) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Sự kiện chưa mở bán");
    }
    return event;
  }

  private void validatePayment(PosBookingCreateRequest request, BigDecimal totalAmount) {
    if (request.getPaymentMethod() == PaymentMethod.CASH
        || request.getPaymentMethod() == PaymentMethod.BANK_TRANSFER) {
      if (request.getAmountReceived() == null || request.getAmountReceived().compareTo(totalAmount) < 0) {
        throw new AppException(HttpStatus.BAD_REQUEST, "Số tiền thực nhận chưa đủ để xác nhận thanh toán");
      }
    }
  }

  private User findOrCreatePosCustomer(PosBookingCreateRequest request, UUID staffId) {
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

  private String generateBookingCode() {
    String code;
    do {
      int length = 8 + RANDOM.nextInt(3);
      StringBuilder builder = new StringBuilder(length);
      for (int i = 0; i < length; i++) {
        builder.append(BOOKING_CODE_CHARS.charAt(RANDOM.nextInt(BOOKING_CODE_CHARS.length())));
      }
      code = builder.toString();
    } while (bookingRepository.existsByBookingCode(code));
    return code;
  }

  private PosTicketClassResponse toTicketClassResponse(TicketClass ticketClass) {
    return PosTicketClassResponse.builder()
        .id(ticketClass.getId())
        .name(ticketClass.getName())
        .colorCode(ticketClass.getColorCode())
        .price(ticketClass.getPrice())
        .build();
  }

  private PosSeatResponse toSeatResponse(Seat seat, TicketClass ticketClass) {
    return PosSeatResponse.builder()
        .id(seat.getId())
        .ticketClassId(seat.getTicketClassId())
        .ticketClassName(ticketClass != null ? ticketClass.getName() : "Unknown")
        .price(ticketClass != null ? ticketClass.getPrice() : BigDecimal.ZERO)
        .gridRow(seat.getGridRow())
        .gridColumn(seat.getGridColumn())
        .label(toSeatLabel(seat))
        .status(seat.getStatus())
        .build();
  }

  private String toSeatLabel(Seat seat) {
    return (char) ('A' + seat.getGridRow()) + String.valueOf(seat.getGridColumn() + 1);
  }

  private PosBookingResponse toBookingResponse(
      Booking booking, List<BookingItem> items, String paymentUrl) {
    return PosBookingResponse.builder()
        .bookingId(booking.getId())
        .bookingCode(booking.getBookingCode())
        .customerId(booking.getCustomerId())
        .status(booking.getStatus())
        .paymentMethod(booking.getPaymentMethod())
        .paymentStatus(booking.getPaymentStatus())
        .totalAmount(booking.getTotalAmount())
        .amountReceived(booking.getAmountReceived())
        .seatLabels(items.stream().map(BookingItem::getSeatLabel).toList())
        .paymentUrl(paymentUrl)
        .build();
  }
}
