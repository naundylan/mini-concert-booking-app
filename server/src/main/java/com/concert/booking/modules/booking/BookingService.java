package com.concert.booking.modules.booking;

import com.concert.booking.modules.booking.dto.*;
import java.util.List;
import java.util.UUID;

public interface BookingService {
  PosCustomerLookupResponse lookupCustomerByPhone(String phone);

  List<PosEventResponse> getOnSaleEvents();

  PosCatalogResponse getCatalog(UUID eventId);

  PosBookingResponse createPosBooking(PosBookingCreateRequest request, UUID staffId);

  PosBookingResponse handleVnpayWebhook(VnpayWebhookRequest request);
}
