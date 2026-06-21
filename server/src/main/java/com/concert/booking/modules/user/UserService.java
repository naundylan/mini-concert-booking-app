package com.concert.booking.modules.user;

import com.concert.booking.modules.auth.security.CustomUserDetails;
import com.concert.booking.modules.user.dto.CreateCustomerDTO;
import com.concert.booking.modules.user.dto.CreateStaffDTO;
import com.concert.booking.modules.user.dto.ResetStaffPasswordDTO;
import com.concert.booking.modules.user.dto.UpdateStaffStatusDTO;
import com.concert.booking.modules.user.dto.UpdateStaffDTO;
import java.util.List;
import java.util.UUID;

public interface UserService {

  User createStaff(CreateStaffDTO dto, UUID createdBy);

  User createCustomer(CreateCustomerDTO dto, UUID createdBy);

  CustomUserDetails loadUserById(UUID userId);

  List<User> getAllStaff();

  User updateStaff(UUID staffId, UpdateStaffDTO dto, UUID updatedBy);

  void updateStaffStatus(UUID staffId, UpdateStaffStatusDTO dto, UUID updatedBy);

  void resetStaffPassword(UUID staffId, ResetStaffPasswordDTO dto, UUID updatedBy);
}
