package com.concert.booking.modules.ticketmail;

import java.util.UUID;

public record TicketMailDto(UUID orderId, String email, String subject, String body) {}
