package com.concert.booking.modules.user;

import com.concert.booking.modules.auth.security.CustomUserDetails;
import com.concert.booking.modules.user.dto.CreateCustomerDTO;
import com.concert.booking.modules.user.dto.CreateStaffDTO;
import com.concert.booking.modules.user.dto.ResetStaffPasswordDTO;
import com.concert.booking.modules.user.dto.UpdateStaffStatusDTO;
import java.util.UUID;

public interface UserService {

  User createStaff(CreateStaffDTO dto, UUID createdBy);

  User createCustomer(CreateCustomerDTO dto, UUID createdBy);

  CustomUserDetails loadUserById(UUID userId);

  void updateStaffStatus(UUID staffId, UpdateStaffStatusDTO dto, UUID updatedBy);

  void resetStaffPassword(UUID staffId, ResetStaffPasswordDTO dto, UUID updatedBy);
}
