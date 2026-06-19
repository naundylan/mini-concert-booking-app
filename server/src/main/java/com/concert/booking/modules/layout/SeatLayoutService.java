package com.concert.booking.modules.layout;

import com.concert.booking.modules.layout.dto.*;
import java.util.UUID;
import org.springframework.data.domain.Page;

public interface SeatLayoutService {
  Page<LayoutResponseDTO> search(String keyword, LayoutStatus status, int page, int size);

  LayoutResponseDTO create(LayoutCreateDTO dto, UUID currentUserId);

  LayoutResponseDTO getById(UUID id);

  LayoutResponseDTO update(UUID id, LayoutUpdateDTO dto, UUID currentUserId);

  LayoutResponseDTO publish(UUID id, UUID currentUserId);

  LayoutResponseDTO clone(UUID id, UUID currentUserId);

  void archive(UUID id, UUID currentUserId);

  LayoutApplyResponseDTO applyToEvent(
      UUID eventId, UUID layoutId, LayoutApplyDTO dto, UUID currentUserId);
}
