package com.concert.booking.modules.user;

import com.concert.booking.common.dto.DataApiResponse;
import com.concert.booking.common.swagger.BadRequestApiResponse;
import com.concert.booking.modules.auth.security.AuthUtils;
import com.concert.booking.modules.user.dto.CreateCustomerDTO;
import com.concert.booking.modules.user.dto.CreateStaffDTO;
import com.concert.booking.modules.user.dto.ResetStaffPasswordDTO;
import com.concert.booking.modules.user.dto.UpdateStaffStatusDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "User Management", description = "Các API quản lý người dùng (Phase 1)")
public class UserV1Controller {

  UserService userService;

  @Operation(summary = "Tạo nhân viên mới", description = "Admin tạo tài khoản Staff.")
  @BadRequestApiResponse
  @PostMapping("/staff")
  public DataApiResponse<User> createStaff(@RequestBody @Valid CreateStaffDTO dto) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    User user = userService.createStaff(dto, currentUserId);
    return DataApiResponse.success(user, "Tạo nhân viên thành công");
  }

  @Operation(
      summary = "Tạo khách hàng POS",
      description = "Staff tạo khách hàng vãng lai tại quầy.")
  @BadRequestApiResponse
  @PostMapping("/customer")
  public DataApiResponse<User> createCustomer(@RequestBody @Valid CreateCustomerDTO dto) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    User user = userService.createCustomer(dto, currentUserId);
    return DataApiResponse.success(user, "Tạo khách hàng thành công");
  }

  @Operation(
      summary = "Cập nhật trạng thái Staff",
      description = "Admin cập nhật trạng thái Active/Inactive của Staff.")
  @BadRequestApiResponse
  @PreAuthorize("hasRole('ADMIN')")
  @PutMapping("/staff/{staffId}/status")
  public DataApiResponse<Void> updateStaffStatus(
      @PathVariable UUID staffId, @RequestBody @Valid UpdateStaffStatusDTO dto) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    userService.updateStaffStatus(staffId, dto, currentUserId);
    return DataApiResponse.success(null, "Cập nhật trạng thái Staff thành công");
  }

  @Operation(
      summary = "Reset mật khẩu Staff",
      description = "Admin đặt lại mật khẩu mới cho Staff.")
  @BadRequestApiResponse
  @PreAuthorize("hasRole('ADMIN')")
  @PutMapping("/staff/{staffId}/reset-password")
  public DataApiResponse<Void> resetStaffPassword(
      @PathVariable UUID staffId, @RequestBody @Valid ResetStaffPasswordDTO dto) {
    UUID currentUserId = AuthUtils.getCurrentUserId();
    userService.resetStaffPassword(staffId, dto, currentUserId);
    return DataApiResponse.success(null, "Reset mật khẩu Staff thành công");
  }
}
