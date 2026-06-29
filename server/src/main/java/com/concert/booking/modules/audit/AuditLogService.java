package com.concert.booking.modules.audit;

import com.concert.booking.modules.audit.enums.AuditLogAction;
import com.concert.booking.modules.audit.enums.AuditLogEntity;
import com.concert.booking.modules.audit.enums.AuditLogStatus;
import java.util.UUID;

public interface AuditLogService {
  void log(
      UUID userId,
      String username,
      AuditLogAction action,
      AuditLogEntity entityName,
      String entityId,
      AuditLogStatus status,
      String message);
}
