package com.concert.booking.modules.user.dto;

import com.concert.booking.modules.user.enums.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateStaffStatusDTO {

  @NotNull(message = "Trạng thái không được để trống")
  UserStatus status;
}
