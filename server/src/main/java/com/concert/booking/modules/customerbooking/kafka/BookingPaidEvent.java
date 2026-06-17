package com.concert.booking.modules.customerbooking.kafka;

import com.concert.booking.modules.order.enums.PaymentMethod;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BookingPaidEvent(
    UUID orderId,
    String orderCode,
    UUID customerId,
    UUID eventId,
    BigDecimal totalAmount,
    PaymentMethod paymentMethod,
    String transactionRef,
    List<UUID> seatIds,
    Instant occurredAt) {}
