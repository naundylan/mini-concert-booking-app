package com.concert.booking.modules.user;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public enum UserMessage {
  INDEX_SUCCESS("Lấy danh sách người dùng thành công"),
  SHOW_SUCCESS("Lấy thông tin người dùng thành công"),
  CREATE_SUCCESS("Tạo người dùng thành công"),
  UPDATE_SUCCESS("Cập nhật người dùng thành công"),
  DELETE_SUCCESS("Xóa người dùng thành công"),

  USERNAME_EXISTS("Tên đăng nhập đã tồn tại"),
  GET_ME_SUCCESS("Lấy thông tin người dùng hiện tại thành công"),
  UPDATE_ME_SUCCESS("Cập nhật thông tin người dùng hiện tại thành công"),
  USERNAME_TAKEN("Tên đăng nhập đã được sử dụng"),
  EMAIL_TAKEN("Email đã được sử dụng"),
  PHONE_TAKEN("Số điện thoại đã được sử dụng"),
  IDENTITY_NUMBER_TAKEN("Số CCCD/CMND đã được sử dụng"),

  NOT_FOUND("Không tìm thấy người dùng");

  String message;
}
