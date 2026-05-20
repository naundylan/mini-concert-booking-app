package com.concert.booking.modules.layout.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LayoutCreateDTO {
  @NotBlank
  @Size(max = 150)
  String name;

  @Size(max = 500)
  String description;

  @Size(max = 150)
  String venueName;

  @Valid LayoutDataDTO layoutData;
}
