package com.concert.booking.modules.admin;

import com.concert.booking.modules.admin.dto.*;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.dto.TicketClassCreateDTO;
import java.util.List;
import java.util.UUID;

public interface AdminCatalogService {
  TicketClass createTicketClass(UUID eventId, TicketClassCreateDTO dto, UUID createdBy);

  List<TicketClass> getTicketClasses(UUID eventId);

  TicketClass updateTicketClass(UUID ticketClassId, AdminTicketClassUpdateDTO dto, UUID updatedBy);

  void deleteTicketClass(UUID ticketClassId);

  SeatGenerateResponseDTO generateSeats(UUID eventId, SeatGenerateDTO dto, UUID createdBy);

  List<SeatResponseDTO> getSeats(UUID eventId);

  SeatResponseDTO updateSeat(UUID seatId, SeatUpdateDTO dto, UUID updatedBy);

  void deleteSeat(UUID seatId);
}
