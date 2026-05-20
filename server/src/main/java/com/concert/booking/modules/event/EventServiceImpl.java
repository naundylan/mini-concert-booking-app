package com.concert.booking.modules.event;

import com.concert.booking.common.exception.AppException;
import com.concert.booking.modules.event.dto.*;
import com.concert.booking.modules.event.enums.EventStatus;
import com.concert.booking.modules.seat.Seat;
import com.concert.booking.modules.seat.SeatRepository;
import com.concert.booking.modules.seat.dto.SeatItemDTO;
import com.concert.booking.modules.seat.dto.SeatLayoutDTO;
import com.concert.booking.modules.seat.enums.SeatStatus;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.TicketClassRepository;
import com.concert.booking.modules.ticket.dto.TicketClassCreateDTO;
import com.concert.booking.modules.ticket.dto.TicketClassUpdateDTO;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EventServiceImpl implements EventService {

    EventRepository eventRepository;
    TicketClassRepository ticketClassRepository;
    SeatRepository seatRepository;

    /**
     * [US-A03] Tạo sự kiện mới ở trạng thái DRAFT
     * - Ràng buộc: teasingTime <= openTime <= startTime <= endTime
     */
    @Override
    @Transactional
    public Event createEvent(EventCreateDTO dto, UUID createdBy) {
        // Validation: Ràng buộc thời gian
        if (dto.getOpenTime().after(dto.getStartTime())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Thời gian mở bán không được trễ hơn thời gian diễn ra");
        }

        if (dto.getTeasingTime().after(dto.getOpenTime())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Thời gian Teasing không được trễ hơn thời gian mở bán");
        }

        if (dto.getStartTime().after(dto.getEndTime())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Thời gian kết thúc không được sớm hơn thời gian bắt đầu");
        }

        Event event = Event.builder()
                .name(dto.getName())
                .location(dto.getLocation())
                .bannerUrl(dto.getBannerUrl())
                .teasingTime(dto.getTeasingTime())
                .openTime(dto.getOpenTime())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .status(EventStatus.DRAFT)
                .createdBy(createdBy)
                .build();

        log.info("Tạo sự kiện mới: {}", event.getName());
        return eventRepository.save(event);
    }

    /**
     * [US-A03] Định giá vé - Tạo tối thiểu 3 hạng vé
     * AC: Phải tạo tối thiểu 3 hạng vé (VIP, Standard...)
     * AC: Price Locking - Không được chỉnh sửa giá nếu đã bán ít nhất 1 vé
     */
    @Override
    @Transactional
    public List<TicketClass> defineTicketClasses(UUID eventId, List<TicketClassCreateDTO> dtos, UUID createdBy) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện"));

        // Validation: Tối thiểu 3 hạng vé
        if (dtos.size() < 3) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Phải tạo tối thiểu 3 hạng vé");
        }

        // Validation: Price Locking - Không được chỉnh sửa nếu sự kiện đang ONSALE và đã bán vé
        if (event.getStatus() == EventStatus.ONSALE || event.getStatus() == EventStatus.ENDED) {
            boolean hasSoldSeats = seatRepository.existsByEventIdAndStatus(eventId, SeatStatus.SOLD);
            if (hasSoldSeats) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Sự kiện đã bán vé, không thể thiết lập lại giá hoặc hạng vé.");
            }
        }

        // Xóa các hạng vé cũ (chỉ được trong trạng thái DRAFT hoặc chưa có vé bán)
        ticketClassRepository.deleteByEventId(eventId);

        List<TicketClass> classes = dtos.stream()
                .map(dto -> TicketClass.builder()
                        .eventId(eventId)
                        .name(dto.getName())
                        .colorCode(dto.getColorCode())
                        .price(dto.getPrice())
                        .createdBy(createdBy)
                        .build())
                .collect(Collectors.toList());

        log.info("Định giá {} hạng vé cho sự kiện {}", classes.size(), eventId);
        return ticketClassRepository.saveAll(classes);
    }

    /**
     * [US-A03] Cập nhật giá vé cho hạng vé cụ thể
     * AC: Price Locking - Không được cập nhật nếu có vé SOLD cho ticket class này
     */
    @Override
    @Transactional
    public TicketClass updateTicketClassPrice(UUID ticketClassId, TicketClassUpdateDTO dto, UUID updatedBy) {
        TicketClass ticketClass = ticketClassRepository.findById(ticketClassId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy hạng vé"));

        // Validation: Price Locking
        boolean hasSoldSeats = ticketClassRepository.hasAnySoldSeats(ticketClassId);
        if (hasSoldSeats) {
            throw new AppException(HttpStatus.BAD_REQUEST, 
                    "Không thể chỉnh sửa giá của hạng vé này vì đã có vé được bán ra (Price Locking)");
        }

        ticketClass.setPrice(dto.getPrice());
        ticketClass.setUpdatedBy(updatedBy);
        log.info("Cập nhật giá vé {} thành {}", ticketClassId, dto.getPrice());
        return ticketClassRepository.save(ticketClass);
    }

    /**
     * [US-A03] Lưu sơ đồ ghế
     * AC: Layout Safety - Không được xóa hoặc đổi Hạng vé của ghế SOLD
     * AC: Hỗ trợ MAINTENANCE status cho ghế bị hỏng vật lý (không thể chọn mua nhưng giữ vị trí)
     */
    @Override
    @Transactional
    public void saveSeatLayout(UUID eventId, SeatLayoutDTO dto, UUID createdBy) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện"));

        // Validation: Layout Safety
        List<Seat> existingSeats = seatRepository.findByEventId(eventId);
        List<Seat> soldSeats = existingSeats.stream()
                .filter(s -> s.getStatus() == SeatStatus.SOLD)
                .collect(Collectors.toList());

        if (!soldSeats.isEmpty()) {
            // Không được xóa toàn bộ sơ đồ nếu có ghế SOLD
            throw new AppException(HttpStatus.BAD_REQUEST, 
                    "Không thể ghi đè sơ đồ ghế khi đã có vé được bán ra (Layout Safety)");
        }

        seatRepository.deleteByEventId(eventId);

        List<Seat> newSeats = dto.getSeats().stream()
                .map(s -> Seat.builder()
                        .eventId(eventId)
                        .ticketClassId(s.getTicketClassId())
                        .gridRow(s.getGridRow())
                        .gridColumn(s.getGridColumn())
                        .label((char) ('A' + s.getGridRow()) + String.valueOf(s.getGridColumn() + 1))
                        .status(s.getStatus() != null ? s.getStatus() : SeatStatus.AVAILABLE)
                        .createdBy(createdBy)
                        .build())
                .collect(Collectors.toList());

        seatRepository.saveAll(newSeats);
        log.info("Lưu sơ đồ ghế cho sự kiện {} với {} ghế", eventId, newSeats.size());
    }

    /**
     * [US-A03] Cập nhật trạng thái ghế (đặc biệt là MAINTENANCE)
     * AC: Maintenance - Ghế chuyển sang màu xám, không thể chọn mua nhưng vẫn giữ nguyên vị trí
     */
    @Override
    @Transactional
    public void updateSeatStatus(UUID seatId, String status, UUID updatedBy) {
        Seat seat = seatRepository.findById(seatId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy ghế"));

        // Validation: Không được đổi trạng thái của ghế SOLD
        if (seat.getStatus() == SeatStatus.SOLD) {
            throw new AppException(HttpStatus.BAD_REQUEST, 
                    "Không thể thay đổi trạng thái của ghế đã bán");
        }

        try {
            SeatStatus newStatus = SeatStatus.valueOf(status.toUpperCase());
            seat.setStatus(newStatus);
            seat.setUpdatedBy(updatedBy);
            seatRepository.save(seat);
            log.info("Cập nhật trạng thái ghế {} thành {}", seatId, newStatus);
        } catch (IllegalArgumentException e) {
            throw new AppException(HttpStatus.BAD_REQUEST, 
                    "Trạng thái ghế không hợp lệ");
        }
    }

    /**
     * [US-A03] Cập nhật trạng thái sự kiện thủ công
     * Vòng đời: DRAFT -> TEASING -> ONSALE -> ENDED
     * AC: Không thể đổi trạng thái nếu sự kiện đã ENDED hoặc CANCELED
     */
    @Override
    @Transactional
    public Event updateEventStatus(UUID eventId, EventStatusUpdateDTO dto, UUID updatedBy) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện"));

        // Validation: Không được đổi trạng thái sự kiện đã kết thúc hoặc bị hủy
        if (event.getStatus() == EventStatus.ENDED || event.getStatus() == EventStatus.CANCELED) {
            throw new AppException(HttpStatus.BAD_REQUEST, 
                    "Không thể thay đổi trạng thái của sự kiện đã kết thúc hoặc bị hủy");
        }

        event.setStatus(dto.getStatus());
        event.setUpdatedBy(updatedBy);
        log.info("Cập nhật trạng thái sự kiện {} thành {}", eventId, dto.getStatus());
        return eventRepository.save(event);
    }

    @Override
    @Transactional
    public Event updateEvent(UUID eventId, EventUpdateDTO dto, UUID updatedBy) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện"));

        EventStatus currentStatus = event.getStatus();

        // CANCELED và ENDED không được làm gì
        if (currentStatus == EventStatus.CANCELED || currentStatus == EventStatus.ENDED) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Không thể chỉnh sửa sự kiện đã hủy hoặc đã kết thúc");
        }

        // ONSALE: chỉ được chuyển sang CANCELED
        if (currentStatus == EventStatus.ONSALE) {
            if (dto.getStatus() != null && dto.getStatus() == EventStatus.CANCELED) {
                event.setStatus(EventStatus.CANCELED);
            } else {
                throw new AppException(HttpStatus.BAD_REQUEST,
                        "Sự kiện đang ONSALE chỉ có thể bị hủy");
            }
            event.setUpdatedBy(updatedBy);
            return eventRepository.save(event);
        }

        // TEASING: chỉ được sửa name, banner, location hoặc chuyển sang CANCELED
        if (currentStatus == EventStatus.TEASING) {
            if (dto.getStatus() != null && dto.getStatus() == EventStatus.CANCELED) {
                event.setStatus(EventStatus.CANCELED);
            } else if (dto.getStatus() != null) {
                throw new AppException(HttpStatus.BAD_REQUEST,
                        "Sự kiện đang TEASING chỉ có thể bị hủy");
            }
            if (dto.getName() != null) event.setName(dto.getName());
            if (dto.getBannerUrl() != null) event.setBannerUrl(dto.getBannerUrl());
            if (dto.getLocation() != null) event.setLocation(dto.getLocation());
            event.setUpdatedBy(updatedBy);
            return eventRepository.save(event);
        }

        // DRAFT: được sửa tất cả
        if (dto.getName() != null) event.setName(dto.getName());
        if (dto.getLocation() != null) event.setLocation(dto.getLocation());
        if (dto.getBannerUrl() != null) event.setBannerUrl(dto.getBannerUrl());
        if (dto.getTeasingTime() != null) event.setTeasingTime(dto.getTeasingTime());
        if (dto.getOpenTime() != null) event.setOpenTime(dto.getOpenTime());
        if (dto.getStartTime() != null) event.setStartTime(dto.getStartTime());
        if (dto.getEndTime() != null) event.setEndTime(dto.getEndTime());
        if (dto.getStatus() != null) event.setStatus(dto.getStatus());
        event.setUpdatedBy(updatedBy);

        return eventRepository.save(event);
    }

    /**
     * Lấy thông tin chi tiết sự kiện
     */
    @Override
    @Transactional(readOnly = true)
    public Event getEventById(UUID eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện"));
    }

    /**
     * Lấy danh sách tất cả hạng vé của sự kiện
     */
    @Override
    @Transactional(readOnly = true)
    public List<TicketClass> getTicketClassesByEventId(UUID eventId) {
        return ticketClassRepository.findByEventId(eventId);
    }

    /**
     * Lấy sơ đồ ghế của sự kiện
     */
    @Override
    @Transactional(readOnly = true)
    public SeatLayoutDTO getSeatLayout(UUID eventId) {
        List<Seat> seats = seatRepository.findByEventId(eventId);
        return SeatLayoutDTO.builder()
                .seats(seats.stream()
                        .map(s -> SeatItemDTO.builder()
                                .id(s.getId())
                                .ticketClassId(s.getTicketClassId())
                                .gridRow(s.getGridRow())
                                .gridColumn(s.getGridColumn())
                                .status(s.getStatus())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    /**
     * Kiểm tra xem ticket class có vé SOLD hay không (Price Locking)
     */
    @Override
    @Transactional(readOnly = true)
    public boolean hasAnySoldSeatsForTicketClass(UUID ticketClassId) {
        return ticketClassRepository.hasAnySoldSeats(ticketClassId);
    }

    /**
     * Kiểm tra xem có vé SOLD cho ticket class nào của sự kiện hay không
     */
    @Override
    @Transactional(readOnly = true)
    public boolean hasAnySoldSeatsInEvent(UUID eventId) {
        return seatRepository.existsByEventIdAndStatus(eventId, SeatStatus.SOLD);
    }

    /**
     * Lấy danh sách tất cả sự kiện
     */
    @Override
    @Transactional(readOnly = true)
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }
}
