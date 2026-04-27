package com.concert.booking.modules.user;

import java.util.UUID;
import com.concert.booking.modules.user.dto.CreateStaffDTO;
import com.concert.booking.modules.user.dto.CreateCustomerDTO;

import com.concert.booking.modules.auth.security.CustomUserDetails;

public interface UserService {

    User createStaff(CreateStaffDTO dto, UUID createdBy);

    User createCustomer(CreateCustomerDTO dto, UUID createdBy);

    CustomUserDetails loadUserById(UUID userId);
}
