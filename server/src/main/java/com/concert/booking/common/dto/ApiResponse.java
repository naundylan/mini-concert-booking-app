package com.concert.booking.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import com.concert.booking.common.exception.AppException;
import org.springframework.http.HttpStatus;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder(toBuilder = true, builderMethodName = "apiBuilder")
@Schema(description = "Standard API response")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ApiResponse {
  @Schema(description = "Indicates whether the API call was successful", example = "true")
  boolean success;

  @Builder.Default
  @Schema(description = "HTTP status code of the response", example = "200")
  int statusCode = 200;

  @Schema(
      description = "Message describing the result of the API call",
      example = "Operation successful")
  String message;

  public static ApiResponse success(String message) {
    return ApiResponse.apiBuilder()
        .success(true)
        .statusCode(HttpStatus.OK.value())
        .message(message)
        .build();
  }

  public static ApiResponse created(String message) {
    return ApiResponse.apiBuilder()
        .statusCode(HttpStatus.CREATED.value())
        .success(true)
        .message(message)
        .build();
  }

  public static ApiResponse internalServerError(String message) {
    return ApiResponse.apiBuilder()
        .success(false)
        .statusCode(HttpStatus.INTERNAL_SERVER_ERROR.value())
        .message(message)
        .build();
  }

  public static ApiResponse notFoundResource(String message) {
    return ApiResponse.apiBuilder()
        .success(false)
        .statusCode(HttpStatus.NOT_FOUND.value())
        .message(message)
        .build();
  }

  public static ApiResponse unauthorized(String message) {
    return ApiResponse.apiBuilder()
        .success(false)
        .statusCode(HttpStatus.UNAUTHORIZED.value())
        .message(message)
        .build();
  }

  public static ApiResponse forbidden(String message) {
    return ApiResponse.apiBuilder()
        .success(false)
        .statusCode(HttpStatus.FORBIDDEN.value())
        .message(message)
        .build();
  }

  public static ApiResponse from(AppException ex) {
    return ApiResponse.apiBuilder()
        .success(false)
        .statusCode(ex.getStatusCode().value())
        .message(ex.getMessage())
        .build();
  }
}
