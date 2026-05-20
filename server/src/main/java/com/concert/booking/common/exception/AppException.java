package com.concert.booking.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AppException extends RuntimeException {
  private final HttpStatus statusCode;

  public AppException(HttpStatus statusCode, String message) {
    super(message);
    this.statusCode = statusCode;
  }
}
