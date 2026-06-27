package com.concert.booking.modules.layout;

import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.event.Event;
import com.concert.booking.modules.event.EventRepository;
import com.concert.booking.modules.event.enums.EventStatus;
import com.concert.booking.modules.layout.dto.*;
import com.concert.booking.modules.seat.Seat;
import com.concert.booking.modules.seat.SeatRepository;
import com.concert.booking.modules.seat.enums.SeatStatus;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.TicketClassRepository;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SeatLayoutServiceImpl implements SeatLayoutService {
  static final int DEFAULT_WORKSPACE_SIZE = 20;
  static final int MAX_PAGE_SIZE = 100;

  SeatLayoutRepository layoutRepository;
  EventRepository eventRepository;
  SeatRepository seatRepository;
  TicketClassRepository ticketClassRepository;

  @Override
  @Transactional(readOnly = true)
  public Page<LayoutResponseDTO> search(String keyword, LayoutStatus status, int page, int size) {
    int safePage = Math.max(page, 0);
    int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    String normalizedKeyword = keyword == null ? "" : keyword.trim();
    return layoutRepository
        .search(normalizedKeyword, status, PageRequest.of(safePage, safeSize))
        .map(this::toResponse);
  }

  @Override
  @Transactional
  public LayoutResponseDTO create(LayoutCreateDTO dto, UUID currentUserId) {
    LayoutDataDTO data = normalizeData(dto.getLayoutData());
    LayoutMetrics metrics = calculateMetrics(data);
    SeatLayout layout =
        SeatLayout.builder()
            .name(dto.getName().trim())
            .description(trimToNull(dto.getDescription()))
            .venueName(trimToNull(dto.getVenueName()))
            .status(LayoutStatus.DRAFT)
            .workspaceRows(data.getWorkspaceRows())
            .workspaceCols(data.getWorkspaceCols())
            .usedRows(metrics.usedRows())
            .usedCols(metrics.usedCols())
            .seatCount(metrics.seatCount())
            .layoutData(data)
            .createdBy(currentUserId)
            .build();
    return toResponse(layoutRepository.save(layout));
  }

  @Override
  @Transactional(readOnly = true)
  public LayoutResponseDTO getById(UUID id) {
    return toResponse(getLayout(id));
  }

  @Override
  @Transactional
  public LayoutResponseDTO update(UUID id, LayoutUpdateDTO dto, UUID currentUserId) {
    SeatLayout layout = getLayout(id);
    if (dto.getName() != null) {
      layout.setName(dto.getName().trim());
    }
    if (dto.getDescription() != null) {
      layout.setDescription(trimToNull(dto.getDescription()));
    }
    if (dto.getVenueName() != null) {
      layout.setVenueName(trimToNull(dto.getVenueName()));
    }

    if (dto.getLayoutData() != null) {
      if (layout.getStatus() != LayoutStatus.DRAFT) {
        throw new AppException(
            HttpStatus.BAD_REQUEST, "Layout đã publish chỉ được sửa thông tin mô tả");
      }
      LayoutDataDTO data = normalizeData(dto.getLayoutData());
      LayoutMetrics metrics = calculateMetrics(data);
      layout.setWorkspaceRows(data.getWorkspaceRows());
      layout.setWorkspaceCols(data.getWorkspaceCols());
      layout.setUsedRows(metrics.usedRows());
      layout.setUsedCols(metrics.usedCols());
      layout.setSeatCount(metrics.seatCount());
      layout.setLayoutData(data);
    }

    layout.setUpdatedBy(currentUserId);
    return toResponse(layoutRepository.save(layout));
  }

  @Override
  @Transactional
  public LayoutResponseDTO publish(UUID id, UUID currentUserId) {
    SeatLayout layout = getLayout(id);
    if (layout.getStatus() != LayoutStatus.DRAFT) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Layout không ở trạng thái DRAFT");
    }
    if (layout.getSeatCount() <= 0 || layout.getLayoutData().getCells().isEmpty()) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Layout chưa có ghế nào được vẽ");
    }
    layout.setStatus(LayoutStatus.PUBLISHED);
    layout.setUpdatedBy(currentUserId);
    return toResponse(layoutRepository.save(layout));
  }

  @Override
  @Transactional
  public LayoutResponseDTO clone(UUID id, UUID currentUserId) {
    SeatLayout source = getLayout(id);
    LayoutDataDTO data = normalizeData(source.getLayoutData());
    LayoutMetrics metrics = calculateMetrics(data);
    SeatLayout clone =
        SeatLayout.builder()
            .name("Copy of " + source.getName())
            .description(source.getDescription())
            .venueName(source.getVenueName())
            .status(LayoutStatus.DRAFT)
            .workspaceRows(data.getWorkspaceRows())
            .workspaceCols(data.getWorkspaceCols())
            .usedRows(metrics.usedRows())
            .usedCols(metrics.usedCols())
            .seatCount(metrics.seatCount())
            .layoutData(data)
            .createdBy(currentUserId)
            .build();
    return toResponse(layoutRepository.save(clone));
  }

  @Override
  @Transactional
  public void archive(UUID id, UUID currentUserId) {
    SeatLayout layout = getLayout(id);
    // Seats are independent clones after apply; do not add FK from Seat to SeatLayout.
    layout.setStatus(LayoutStatus.ARCHIVED);
    layout.setUpdatedBy(currentUserId);
    layoutRepository.save(layout);
  }

  @Override
  @Transactional
  public LayoutApplyResponseDTO applyToEvent(
      UUID eventId, UUID layoutId, LayoutApplyDTO dto, UUID currentUserId) {
    Event event =
        eventRepository
            .findById(eventId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện"));
    if (event.getStatus() != EventStatus.DRAFT) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Chỉ được apply layout khi event đang DRAFT");
    }

    SeatLayout layout = getLayout(layoutId);
    if (layout.getStatus() != LayoutStatus.PUBLISHED) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Layout chưa được publish");
    }
    if (layout.getSeatCount() <= 0 || layout.getLayoutData().getCells().isEmpty()) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Layout chưa có ghế nào được vẽ");
    }
    if (seatRepository.existsByEventIdAndStatus(eventId, SeatStatus.SOLD)) {
      throw new AppException(
          HttpStatus.CONFLICT, "Không thể apply layout vì event đã có vé bán ra");
    }

    // ticketClassKey belongs to the reusable layout template. ticketClassId belongs to this event.
    // Extra mappings are accepted but ignored; only keys that appear in painted cells are used.
    Map<String, UUID> mapping =
        dto.getTicketClassMappings().stream()
            .collect(
                Collectors.toMap(
                    item -> item.getTicketClassKey().trim(),
                    LayoutApplyDTO.TicketClassMappingDTO::getTicketClassId,
                    (left, right) -> right));
    Map<UUID, TicketClass> ticketClassById =
        ticketClassRepository.findByEventId(eventId).stream()
            .collect(Collectors.toMap(TicketClass::getId, Function.identity()));

    LayoutDataDTO data = normalizeData(layout.getLayoutData());
    ensureAllKeysMapped(data, mapping, ticketClassById);

    if (seatRepository.countByEventId(eventId) > 0) {
      seatRepository.deleteByEventId(eventId);
    }

    // Seat rows/columns are copied from the layout, but labels are recomputed here.
    // layoutData.cells.previewLabel is editor-only. Seat.label is the source of truth for POS,
    // tickets, and check-in.
    LayoutMetrics metrics = calculateMetrics(data);
    List<Seat> seats =
        data.getCells().stream()
            .map(
                cell -> {
                  UUID ticketClassId = mapping.get(cell.getTicketClassKey());
                  return Seat.builder()
                      .eventId(eventId)
                      .ticketClassId(ticketClassId)
                      .gridRow(cell.getRow())
                      .gridColumn(cell.getCol())
                      .label(toOfficialLabel(cell, metrics))
                      .status(SeatStatus.AVAILABLE)
                      .createdBy(currentUserId)
                      .build();
                })
            .collect(Collectors.toList());
    seatRepository.saveAll(seats);
    return LayoutApplyResponseDTO.builder().createdCount(seats.size()).build();
  }

  private SeatLayout getLayout(UUID id) {
    return layoutRepository
        .findById(id)
        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy layout"));
  }

  private void ensureAllKeysMapped(
      LayoutDataDTO data, Map<String, UUID> mapping, Map<UUID, TicketClass> ticketClassById) {
    Set<String> missingKeys =
        data.getCells().stream()
            .map(LayoutCellDTO::getTicketClassKey)
            .filter(key -> !mapping.containsKey(key))
            .collect(Collectors.toCollection(TreeSet::new));
    if (!missingKeys.isEmpty()) {
      throw new AppException(
          HttpStatus.BAD_REQUEST, "Thiếu mapping hạng vé cho: " + String.join(", ", missingKeys));
    }
    List<UUID> invalidClassIds =
        mapping.values().stream()
            .filter(id -> !ticketClassById.containsKey(id))
            .distinct()
            .toList();
    if (!invalidClassIds.isEmpty()) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Hạng vé không thuộc event");
    }
  }

  private LayoutDataDTO normalizeData(LayoutDataDTO data) {
    LayoutDataDTO safeData = data != null ? data : LayoutDataDTO.builder().build();
    int workspaceRows = Math.max(safeData.getWorkspaceRows(), DEFAULT_WORKSPACE_SIZE);
    int workspaceCols = Math.max(safeData.getWorkspaceCols(), DEFAULT_WORKSPACE_SIZE);
    String templateType = trimToNull(safeData.getTemplateType());
    List<LayoutCellDTO> cells =
        Optional.ofNullable(safeData.getCells()).orElseGet(ArrayList::new).stream()
            .filter(cell -> cell.getTicketClassKey() != null && !cell.getTicketClassKey().isBlank())
            .collect(
                Collectors.toMap(
                    cell -> cell.getRow() + ":" + cell.getCol(),
                    cell ->
                        LayoutCellDTO.builder()
                            .row(cell.getRow())
                            .col(cell.getCol())
                            .previewLabel(trimToNull(cell.getPreviewLabel()))
                            .ticketClassKey(cell.getTicketClassKey().trim())
                            .customPreviewLabel(Boolean.TRUE.equals(cell.getCustomPreviewLabel()))
                            .build(),
                    (left, right) -> right,
                    LinkedHashMap::new))
            .values()
            .stream()
            .sorted(
                Comparator.comparingInt(LayoutCellDTO::getRow)
                    .thenComparingInt(LayoutCellDTO::getCol))
            .toList();
    // Decorations describe non-seat editor landmarks such as a stage/screen.
    // They are preserved in layout JSONB but are never counted or applied as Seat inventory.
    List<LayoutDataDTO.LayoutDecorationDTO> decorations =
        Optional.ofNullable(safeData.getDecorations()).orElseGet(ArrayList::new).stream()
            .filter(decoration -> trimToNull(decoration.getType()) != null)
            .map(
                decoration ->
                    LayoutDataDTO.LayoutDecorationDTO.builder()
                        .id(trimToNull(decoration.getId()))
                        .type(trimToNull(decoration.getType()))
                        .label(trimToNull(decoration.getLabel()))
                        .row(Math.max(0, decoration.getRow()))
                        .col(Math.max(0, decoration.getCol()))
                        .rowSpan(Math.max(1, decoration.getRowSpan()))
                        .colSpan(Math.max(1, decoration.getColSpan()))
                        .shape(trimToNull(decoration.getShape()))
                        .build())
            .toList();
    LayoutMetrics metrics = calculateMetrics(cells);
    return LayoutDataDTO.builder()
        .workspaceRows(workspaceRows)
        .workspaceCols(workspaceCols)
        .templateType(templateType)
        .usedBounds(toUsedBounds(metrics))
        .cells(cells)
        .decorations(decorations)
        .build();
  }

  private LayoutMetrics calculateMetrics(LayoutDataDTO data) {
    return calculateMetrics(Optional.ofNullable(data.getCells()).orElseGet(ArrayList::new));
  }

  private LayoutMetrics calculateMetrics(List<LayoutCellDTO> cells) {
    if (cells.isEmpty()) {
      return new LayoutMetrics(0, 0, 0, 0, 0, 0, 0);
    }
    int minRow = cells.stream().mapToInt(LayoutCellDTO::getRow).min().orElse(0);
    int maxRow = cells.stream().mapToInt(LayoutCellDTO::getRow).max().orElse(0);
    int minCol = cells.stream().mapToInt(LayoutCellDTO::getCol).min().orElse(0);
    int maxCol = cells.stream().mapToInt(LayoutCellDTO::getCol).max().orElse(0);
    return new LayoutMetrics(
        minRow, maxRow, minCol, maxCol, maxRow - minRow + 1, maxCol - minCol + 1, cells.size());
  }

  private LayoutDataDTO.UsedBoundsDTO toUsedBounds(LayoutMetrics metrics) {
    return LayoutDataDTO.UsedBoundsDTO.builder()
        .minRow(metrics.minRow())
        .maxRow(metrics.maxRow())
        .minCol(metrics.minCol())
        .maxCol(metrics.maxCol())
        .usedRows(metrics.usedRows())
        .usedCols(metrics.usedCols())
        .build();
  }

  private String toOfficialLabel(LayoutCellDTO cell, LayoutMetrics metrics) {
    // Example: painted cells at (5,8), (5,9), (6,8) have minRow=5 and minCol=8.
    // Their official labels become 1-1, 1-2, and 2-1 regardless of workspace position.
    int normalizedRow = cell.getRow() - metrics.minRow();
    int normalizedCol = cell.getCol() - metrics.minCol() + 1;
    return (normalizedRow + 1) + "-" + normalizedCol;
  }

  private String trimToNull(String value) {
    if (value == null || value.trim().isBlank()) {
      return null;
    }
    return value.trim();
  }

  private LayoutResponseDTO toResponse(SeatLayout layout) {
    return LayoutResponseDTO.builder()
        .id(layout.getId())
        .name(layout.getName())
        .description(layout.getDescription())
        .venueName(layout.getVenueName())
        .status(layout.getStatus())
        .workspaceRows(layout.getWorkspaceRows())
        .workspaceCols(layout.getWorkspaceCols())
        .usedRows(layout.getUsedRows())
        .usedCols(layout.getUsedCols())
        .seatCount(layout.getSeatCount())
        .layoutData(layout.getLayoutData())
        .version(layout.getVersion())
        .createdAt(layout.getCreatedAt())
        .updatedAt(layout.getUpdatedAt())
        .build();
  }

  private record LayoutMetrics(
      int minRow, int maxRow, int minCol, int maxCol, int usedRows, int usedCols, int seatCount) {}
}
