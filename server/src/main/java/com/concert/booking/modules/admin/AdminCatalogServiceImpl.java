package com.concert.booking.modules.admin;

import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.admin.dto.*;
import com.concert.booking.modules.event.Event;
import com.concert.booking.modules.event.EventRepository;
import com.concert.booking.modules.event.enums.EventStatus;
import com.concert.booking.modules.seat.Seat;
import com.concert.booking.modules.seat.SeatRepository;
import com.concert.booking.modules.seat.enums.SeatStatus;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.TicketClassRepository;
import com.concert.booking.modules.ticket.dto.TicketClassCreateDTO;
import java.util.ArrayList;
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
public class AdminCatalogServiceImpl implements AdminCatalogService {
  EventRepository eventRepository;
  TicketClassRepository ticketClassRepository;
  SeatRepository seatRepository;

  @Override
  @Transactional
  public TicketClass createTicketClass(UUID eventId, TicketClassCreateDTO dto, UUID createdBy) {
    Event event = getEvent(eventId);
    ensureDraft(event);

    return ticketClassRepository.save(
        TicketClass.builder()
            .eventId(eventId)
            .name(dto.getName())
            .colorCode(dto.getColorCode())
            .price(dto.getPrice())
            .createdBy(createdBy)
            .build());
  }

  @Override
  @Transactional(readOnly = true)
  public List<TicketClass> getTicketClasses(UUID eventId) {
    getEvent(eventId);
    return ticketClassRepository.findByEventId(eventId);
  }

  @Override
  @Transactional
  public TicketClass updateTicketClass(
      UUID ticketClassId, AdminTicketClassUpdateDTO dto, UUID updatedBy) {
    TicketClass ticketClass = getTicketClass(ticketClassId);
    Event event = getEvent(ticketClass.getEventId());
    ensureDraft(event);

    if (seatRepository.hasSoldSeatsForTicketClass(ticketClassId)) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Không thể sửa hạng vé đã có ghế bán ra");
    }

    if (dto.getName() != null) {
      ticketClass.setName(dto.getName());
    }
    if (dto.getColorCode() != null) {
      ticketClass.setColorCode(dto.getColorCode());
    }
    if (dto.getPrice() != null) {
      ticketClass.setPrice(dto.getPrice());
    }
    ticketClass.setUpdatedBy(updatedBy);
    return ticketClassRepository.save(ticketClass);
  }

  @Override
  @Transactional
  public void deleteTicketClass(UUID ticketClassId) {
    TicketClass ticketClass = getTicketClass(ticketClassId);
    Event event = getEvent(ticketClass.getEventId());
    ensureDraft(event);

    if (!seatRepository.findByTicketClassId(ticketClassId).isEmpty()) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Không thể xóa hạng vé đang được gán cho ghế");
    }
    ticketClassRepository.delete(ticketClass);
  }

  @Override
  @Transactional
  public SeatGenerateResponseDTO generateSeats(UUID eventId, SeatGenerateDTO dto, UUID createdBy) {
    Event event = getEvent(eventId);
    ensureDraft(event);
    TicketClass ticketClass = getTicketClass(dto.getTicketClassId());
    if (!eventId.equals(ticketClass.getEventId())) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Hạng vé không thuộc sự kiện này");
    }

    int startRow = toStartRow(dto.getRowPrefix());
    List<Seat> seats = new ArrayList<>();
    for (int rowOffset = 0; rowOffset < dto.getTotalRows(); rowOffset++) {
      int gridRow = startRow + rowOffset;
      for (int col = 0; col < dto.getTotalColumns(); col++) {
        if (seatRepository.existsByEventIdAndGridRowAndGridColumn(eventId, gridRow, col)) {
          throw new AppException(
              HttpStatus.CONFLICT,
              "Ghế " + toSeatLabel(gridRow, col) + " đã tồn tại trong sự kiện này");
        }
        seats.add(
            Seat.builder()
                .eventId(eventId)
                .ticketClassId(ticketClass.getId())
                .gridRow(gridRow)
                .gridColumn(col)
                .label(toSeatLabel(gridRow, col))
                .status(SeatStatus.AVAILABLE)
                .createdBy(createdBy)
                .build());
      }
    }

    seatRepository.saveAll(seats);
    return SeatGenerateResponseDTO.builder().createdCount(seats.size()).build();
  }

  @Override
  @Transactional(readOnly = true)
  public List<SeatResponseDTO> getSeats(UUID eventId) {
    getEvent(eventId);
    Map<UUID, TicketClass> ticketClassById =
        ticketClassRepository.findByEventId(eventId).stream()
            .collect(Collectors.toMap(TicketClass::getId, Function.identity()));

    return seatRepository.findByEventId(eventId).stream()
        .sorted(Comparator.comparingInt(Seat::getGridRow).thenComparingInt(Seat::getGridColumn))
        .map(seat -> toSeatResponse(seat, ticketClassById.get(seat.getTicketClassId())))
        .toList();
  }

  @Override
  @Transactional
  public SeatResponseDTO updateSeat(UUID seatId, SeatUpdateDTO dto, UUID updatedBy) {
    Seat seat =
        seatRepository
            .findById(seatId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy ghế"));
    if (seat.getStatus() == SeatStatus.SOLD) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Không thể sửa ghế đã bán");
    }

    if (dto.getTicketClassId() != null) {
      Event event = getEvent(seat.getEventId());
      ensureDraft(event);
      TicketClass ticketClass = getTicketClass(dto.getTicketClassId());
      if (!seat.getEventId().equals(ticketClass.getEventId())) {
        throw new AppException(HttpStatus.BAD_REQUEST, "Hạng vé không thuộc sự kiện của ghế");
      }
      seat.setTicketClassId(ticketClass.getId());
    }

    if (dto.getStatus() != null) {
      if (dto.getStatus() == SeatStatus.SOLD) {
        throw new AppException(HttpStatus.BAD_REQUEST, "Không cập nhật SOLD thủ công từ admin");
      }
      seat.setStatus(dto.getStatus());
    }
    seat.setUpdatedBy(updatedBy);
    Seat saved = seatRepository.save(seat);
    TicketClass ticketClass = getTicketClass(saved.getTicketClassId());
    return toSeatResponse(saved, ticketClass);
  }

  @Override
  @Transactional
  public void deleteSeat(UUID seatId) {
    Seat seat =
        seatRepository
            .findById(seatId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy ghế"));
    if (seat.getStatus() == SeatStatus.SOLD) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Không thể xóa ghế đã bán");
    }
    ensureDraft(getEvent(seat.getEventId()));
    seatRepository.delete(seat);
  }

  private Event getEvent(UUID eventId) {
    return eventRepository
        .findById(eventId)
        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện"));
  }

  private TicketClass getTicketClass(UUID ticketClassId) {
    return ticketClassRepository
        .findById(ticketClassId)
        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy hạng vé"));
  }

  private void ensureDraft(Event event) {
    if (event.getStatus() != EventStatus.DRAFT) {
      throw new AppException(
          HttpStatus.BAD_REQUEST,
          "Chỉ được cấu hình hạng vé và ghế khi sự kiện đang ở trạng thái DRAFT");
    }
  }

  private int toStartRow(String rowPrefix) {
    if (rowPrefix == null || rowPrefix.isBlank()) {
      return 0;
    }
    char row = Character.toUpperCase(rowPrefix.trim().charAt(0));
    if (row < 'A' || row > 'Z') {
      throw new AppException(HttpStatus.BAD_REQUEST, "Ký hiệu hàng bắt đầu không hợp lệ");
    }
    return row - 'A';
  }

  private SeatResponseDTO toSeatResponse(Seat seat, TicketClass ticketClass) {
    return SeatResponseDTO.builder()
        .id(seat.getId())
        .gridRow(seat.getGridRow())
        .gridColumn(seat.getGridColumn())
        .label(
            seat.getLabel() != null
                ? seat.getLabel()
                : toSeatLabel(seat.getGridRow(), seat.getGridColumn()))
        .status(seat.getStatus())
        .ticketClass(toTicketClassDTO(ticketClass))
        .build();
  }

  private SeatResponseDTO.TicketClassDTO toTicketClassDTO(TicketClass ticketClass) {
    if (ticketClass == null) {
      return null;
    }
    return SeatResponseDTO.TicketClassDTO.builder()
        .id(ticketClass.getId())
        .name(ticketClass.getName())
        .colorCode(ticketClass.getColorCode())
        .price(ticketClass.getPrice())
        .build();
  }

  private String toSeatLabel(int row, int column) {
    return (char) ('A' + row) + String.valueOf(column + 1);
  }
}
