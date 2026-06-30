package com.concert.booking.modules.checkin;

import com.concert.booking.modules.checkin.dto.*;
import java.util.List;
import java.util.UUID;

public interface CheckInService {
  List<CheckInEventDTO> getCheckInEvents();

  List<CheckInOrderDTO> search(UUID eventId, String keyword);

  CheckInResponseDTO checkInTicket(UUID ticketId, UUID eventId, UUID staffId);

  List<CheckInHistoryDTO> getHistory(UUID eventId, String keyword, UUID staffId);
}
