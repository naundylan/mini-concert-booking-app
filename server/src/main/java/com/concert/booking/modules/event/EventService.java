package com.concert.booking.modules.event;

import com.concert.booking.modules.event.dto.*;
import com.concert.booking.modules.seat.dto.SeatLayoutDTO;
import com.concert.booking.modules.ticket.TicketClass;
import com.concert.booking.modules.ticket.dto.TicketClassCreateDTO;
import com.concert.booking.modules.ticket.dto.TicketClassUpdateDTO;

import java.util.List;
import java.util.UUID;

public interface EventService {
    /**
     * [US-A03] Tạo sự kiện mới ở trạng thái DRAFT
     */
    Event createEvent(EventCreateDTO dto, UUID createdBy);

    /**
     * [US-A03] Định giá vé - Tạo tối thiểu 3 hạng vé
     * - Ràng buộc: Phải ít nhất 3 hạng vé
     * - Price Locking: Không được chỉnh sửa giá nếu đã bán ít nhất 1 vé
     */
    List<TicketClass> defineTicketClasses(UUID eventId, List<TicketClassCreateDTO> dtos, UUID createdBy);

    /**
     * [US-A03] Cập nhật giá vé cho hạng vé cụ thể
     * - Price Locking: Không được cập nhật nếu có vé SOLD
     */
    TicketClass updateTicketClassPrice(UUID ticketClassId, TicketClassUpdateDTO dto, UUID updatedBy);

    /**
     * [US-A03] Lưu sơ đồ ghế
     * - Layout Safety: Không được xóa hoặc thay đổi ticket class của ghế SOLD
     * - Hỗ trợ MAINTENANCE status cho ghế bị hỏng vật lý
     */
    void saveSeatLayout(UUID eventId, SeatLayoutDTO dto, UUID createdBy);

    /**
     * [US-A03] Cập nhật trạng thái ghế (đặc biệt là MAINTENANCE)
     * - Maintenance: Ghế chuyển sang màu xám, không thể chọn mua nhưng vẫn giữ vị trí
     */
    void updateSeatStatus(UUID seatId, String status, UUID updatedBy);

    /**
     * [US-A03] Cập nhật trạng thái sự kiện thủ công
     * - Có thể cập nhật khi sự kiện chưa ENDED hoặc CANCELED
     */
    Event updateEventStatus(UUID eventId, EventStatusUpdateDTO dto, UUID updatedBy);

    /**
     * Lấy thông tin chi tiết sự kiện
     */
    Event getEventById(UUID eventId);

    /**
     * Lấy danh sách tất cả hạng vé của sự kiện
     */
    List<TicketClass> getTicketClassesByEventId(UUID eventId);

    /**
     * Lấy sơ đồ ghế của sự kiện
     */
    SeatLayoutDTO getSeatLayout(UUID eventId);

    /**
     * Kiểm tra xem ticket class có vé SOLD hay không (Price Locking)
     */
    boolean hasAnySoldSeatsForTicketClass(UUID ticketClassId);

    /**
     * Kiểm tra xem có vé SOLD cho ticket class nào của sự kiện hay không
     */
    boolean hasAnySoldSeatsInEvent(UUID eventId);
}