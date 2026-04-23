package com.concert.booking.common.constants;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public enum MessageConstants {
    INTERNAL_SERVER_ERROR("Lỗi hệ thống, vui lòng thử lại sau"),
    BAD_REQUEST("Yêu cầu không hợp lệ"),
    FORBIDDEN("Bạn không có quyền truy cập"),
    UNAUTHORIZED("Bạn chưa được xác thực"),
    RESOURCE_NOT_FOUND("Không tìm thấy tài nguyên");

    String message;
}