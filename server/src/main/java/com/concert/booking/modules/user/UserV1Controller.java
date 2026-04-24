package com.concert.booking.modules.user;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import com.concert.booking.common.dto.DataApiResponse;
import com.concert.booking.common.swagger.BadRequestApiResponse;
import com.concert.booking.modules.auth.security.AuthUtils;
import com.concert.booking.modules.user.dto.CreateStaffDTO;
import com.concert.booking.modules.user.dto.CreateCustomerDTO;
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

    @Operation(summary = "Tạo khách hàng POS", description = "Staff tạo khách hàng vãng lai tại quầy.")
    @BadRequestApiResponse
    @PostMapping("/customer")
    public DataApiResponse<User> createCustomer(@RequestBody @Valid CreateCustomerDTO dto) {
        UUID currentUserId = AuthUtils.getCurrentUserId();
        User user = userService.createCustomer(dto, currentUserId);
        return DataApiResponse.success(user, "Tạo khách hàng thành công");
    }
}