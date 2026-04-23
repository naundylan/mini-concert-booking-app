package com.concert.booking.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder(toBuilder = true)
@Schema(description = "API response containing a single data item")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DataApiResponse<T> extends ApiResponse {

  @Schema(description = "Data returned by the API call")
  T data;

  public static <T> DataApiResponse<T> success(T data, String message) {
    return DataApiResponse.<T>builder().success(true).message(message).data(data).build();
  }

  public static DataApiResponse<BadRequestApiResponse> badRequest(
      BadRequestApiResponse data, String message) {
    return DataApiResponse.<BadRequestApiResponse>builder()
        .success(false)
        .message(message)
        .statusCode(400)
        .data(data)
        .build();
  }
}
