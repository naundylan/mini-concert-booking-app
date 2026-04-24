package com.concert.booking.modules.auth;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public enum AuthMessage {
  INVALID_CREDENTIALS("Tên đăng nhập hoặc mật khẩu không đúng"),
  INACTIVE("Tài khoản chưa được kích hoạt"),
  LOCKED("Tài khoản đã bị khóa"),
  INVALID_RESET_PASSWORD_TOKEN("Token đặt lại mật khẩu không hợp lệ"),
  EXPIRED_RESET_PASSWORD_TOKEN("Token đặt lại mật khẩu đã hết hạn"),
  INVALID_REFRESH_TOKEN("Refresh token không hợp lệ"),
  EXPIRED_REFRESH_TOKEN("Refresh token đã hết hạn"),

  LOGIN_SUCCESS("Đăng nhập thành công"),
  TOKEN_REFRESH_SUCCESS("Làm mới token thành công"),
  LOGOUT_SUCCESS("Đăng xuất thành công"),

  SIGNUP_SUCCESS("Đăng ký tài khoản thành công"),
  PASSWORD_CHANGE_SUCCESS("Đổi mật khẩu thành công"),
  SEND_RESET_PASSWORD_SUCCESS("Gửi email đặt lại mật khẩu thành công"),
  RESET_PASSWORD_SUCCESS("Đặt lại mật khẩu thành công"),

  DELETED("Tài khoản đã bị xóa");

  String message;
}